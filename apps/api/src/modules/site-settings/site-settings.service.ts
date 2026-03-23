import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

export type SocialLink = { platform: string; url: string; label?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];
  const out: SocialLink[] = [];
  for (const item of value) {
    if (!isRecord(item)) continue;
    const platform = typeof item.platform === "string" ? item.platform.trim() : "";
    const url = typeof item.url === "string" ? item.url.trim() : "";
    const label = typeof item.label === "string" ? item.label.trim() : undefined;
    if (!platform) continue;
    out.push({
      platform: platform.slice(0, 48),
      url: url.slice(0, 2048),
      ...(label ? { label: label.slice(0, 64) } : {}),
    });
  }
  return out;
}

function ensureHttpUrl(url: string) {
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) {
    throw new BadRequestException("URL media sosial harus diawali http:// atau https://");
  }
}

@Injectable()
export class SiteSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreate() {
    return this.prisma.siteSettings.upsert({
      where: { id: "default" },
      update: {},
      create: { id: "default", socialLinks: [] },
    });
  }

  async getPublic() {
    const row = await this.getOrCreate();
    const links = parseSocialLinks(row.socialLinks);
    return { socialLinks: links };
  }

  async updateSocialLinks(input: unknown) {
    const links = parseSocialLinks(input);
    for (const l of links) ensureHttpUrl(l.url);

    const row = await this.prisma.siteSettings.upsert({
      where: { id: "default" },
      update: { socialLinks: links as unknown as Prisma.InputJsonValue },
      create: { id: "default", socialLinks: links as unknown as Prisma.InputJsonValue },
    });
    return { socialLinks: parseSocialLinks(row.socialLinks) };
  }
}
