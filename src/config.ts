import dotenv from "dotenv";

dotenv.config();

type JWTConfig = {
  secret: string;
  issuer: string;
  accessTokenDurationSeconds: number;
  refreshTokenDurationMs: number;
};

type APIConfig = {
  port: number;
};

type DBConfig = {
  url: string;
};

type AppConfig = {
  api: APIConfig;
  db: DBConfig;
  jwt: JWTConfig;
};

function envOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config: AppConfig = {
  api: {
    port: parseNumber(process.env.PORT, 8010),
  },
  db: {
    url: envOrThrow("DATABASE_URL"),
  },
  jwt: {
    secret: envOrThrow("JWT_SECRET"),
    issuer: process.env.JWT_ISSUER ?? "autolinks",
    accessTokenDurationSeconds: parseNumber(
      process.env.JWT_ACCESS_TTL_SECONDS,
      60 * 60,
    ),
    refreshTokenDurationMs: parseNumber(
      process.env.JWT_REFRESH_TTL_MS,
      60 * 60 * 24 * 30 * 1000,
    ),
  },
};
