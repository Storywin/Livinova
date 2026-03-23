type EnvShape = {
  NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
  REDIS_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
};

export function validateEnv(config: Record<string, unknown>) {
  const required: Array<keyof EnvShape> = [
    "NODE_ENV",
    "PORT",
    "DATABASE_URL",
    "REDIS_URL",
    "JWT_ACCESS_SECRET",
    "JWT_REFRESH_SECRET",
    "JWT_ACCESS_EXPIRES_IN",
    "JWT_REFRESH_EXPIRES_IN",
  ];

  const missing = required.filter((k) => {
    const v = config[k as string];
    return typeof v !== "string" || v.length === 0;
  });

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }

  return config;
}
