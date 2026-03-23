import { RoleName } from "@prisma/client";

export type JwtUser = {
  sub: string;
  email: string;
  roles: RoleName[];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};
