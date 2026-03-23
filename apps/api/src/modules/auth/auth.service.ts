import { createHash } from "crypto";

import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { RoleName } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { RolesService } from "../roles/roles.service";
import { UsersService } from "../users/users.service";

import { hashPassword, verifyPassword } from "./password";
import { AuthTokens, JwtUser } from "./types";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function parseDurationMs(input: string) {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(input.trim());
  if (!match) throw new Error(`Invalid duration: ${input}`);
  const value = Number(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return value * multipliers[unit];
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async issueTokens(user: {
    id: string;
    email: string;
    roles: RoleName[];
  }): Promise<AuthTokens> {
    const payload: JwtUser = { sub: user.id, email: user.email, roles: user.roles };

    const accessToken = await this.jwtService.signAsync(payload);

    const refreshSecret = this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");
    const refreshExpiresIn = this.configService.getOrThrow<string>("JWT_REFRESH_EXPIRES_IN");
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn as any,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + parseDurationMs(refreshExpiresIn));

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  async register(input: { email: string; password: string; name?: string; phone?: string }) {
    const existing = await this.usersService.findByEmail(input.email);
    if (existing) throw new BadRequestException("Email sudah terdaftar");

    await this.rolesService.ensureBaselineRoles();
    const buyerRole = await this.prisma.role.findUnique({ where: { name: RoleName.buyer } });
    if (!buyerRole) throw new Error("Role buyer tidak ditemukan");

    const passwordHash = await hashPassword(input.password);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        phone: input.phone,
        roles: {
          create: [{ roleId: buyerRole.id }],
        },
      },
      include: { roles: { include: { role: true } } },
    });

    const roles = user.roles.map((r) => r.role.name);
    const tokens = await this.issueTokens({ id: user.id, email: user.email, roles });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        roles,
      },
      tokens,
    };
  }

  async login(input: { email: string; password: string }) {
    const user = await this.usersService.findByEmail(input.email);
    if (!user) throw new UnauthorizedException("Email atau kata sandi salah");

    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Email atau kata sandi salah");

    const roles = user.roles.map((r) => r.role.name);
    const tokens = await this.issueTokens({ id: user.id, email: user.email, roles });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        roles,
      },
      tokens,
    };
  }

  async refresh(input: { refreshToken: string }) {
    const refreshSecret = this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");

    let payload: JwtUser;
    try {
      payload = await this.jwtService.verifyAsync<JwtUser>(input.refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException("Refresh token tidak valid");
    }

    const tokenHash = hashToken(input.refreshToken);
    const record = await this.prisma.refreshToken.findFirst({
      where: {
        userId: payload.sub,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) throw new UnauthorizedException("Refresh token tidak valid");

    await this.prisma.refreshToken.update({
      where: { id: record.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException("Pengguna tidak ditemukan");

    const roles = user.roles.map((r) => r.role.name);
    return this.issueTokens({ id: user.id, email: user.email, roles });
  }

  async logout(input: { refreshToken: string }) {
    const tokenHash = hashToken(input.refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
