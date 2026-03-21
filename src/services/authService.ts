import {
  BadRequestError,
  UnauthorizedError,
} from "../api/errors.js";
import {
  generateRefreshToken,
  makeAccessToken,
  validateAccessToken,
  verifyPassword,
} from "../auth.js";
import { refreshTokenRepository } from "../repositories/refreshTokenRepository.js";
import { userRepository } from "../repositories/userRepository.js";
import type { LoginRequest } from "../types/user.types.js";
import { toPublicUser } from "./mappers/userMapper.js";

const isValidString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export class AuthService {
  constructor(
    private users = userRepository,
    private refreshTokens = refreshTokenRepository,
  ) {}

  async login(loginRequest: LoginRequest) {
    if (
      !isValidString(loginRequest.email) ||
      !isValidString(loginRequest.password)
    ) {
      throw new BadRequestError("email and password are required");
    }

    const normalizedEmail = loginRequest.email.trim().toLowerCase();
    const sanitizedPassword = loginRequest.password.trim();

    const user = await this.users.findByEmail(normalizedEmail);
    if (!user) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const passwordMatches = await verifyPassword(sanitizedPassword, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedError("Invalid credentials");
    }

    const token = makeAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    await this.refreshTokens.create(user.id, refreshToken);

    return {
      user: toPublicUser(user),
      token,
      refreshToken,
    };
  }

  async refreshAccessToken(bearerToken: string) {
    const refreshTokenRecord = await this.refreshTokens.findByToken(bearerToken);

    if (!refreshTokenRecord) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    if (refreshTokenRecord.revoked_at) {
      throw new UnauthorizedError("Refresh token revoked");
    }

    if (refreshTokenRecord.expires_at <= new Date()) {
      throw new UnauthorizedError("Refresh token expired");
    }

    const token = makeAccessToken(refreshTokenRecord.user_id);
    return { token };
  }

  async logout(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestError("Missing refresh token");
    }
    await this.refreshTokens.revoke(refreshToken);
  }

  verifyAccessToken(token: string) {
    return validateAccessToken(token);
  }
}

export const authService = new AuthService();
