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

type BrevoConfig = {
  apiKey: string;
};

type AppConfig = {
  api: APIConfig;
  db: DBConfig;
  jwt: JWTConfig;
  brevo: BrevoConfig;
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
    port: parseNumber(process.env.PORT, 8080),
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
  brevo: {
    apiKey: (() => {
      const apiKey =
        process.env.BREVO_API_KEY ?? process.env.SENDINBLUE_API_KEY;
      if (!apiKey) {
        throw new Error(
          "BREVO_API_KEY or SENDINBLUE_API_KEY environment variable must be configured",
        );
      }
      return apiKey;
    })(),
  },
};
