import {
  BadRequestError,
  ConflictError,
} from "../api/errors.js";
import {
  generateRefreshToken,
  hashPassword,
  makeAccessToken,
} from "../auth.js";
import { userRepository } from "../repositories/userRepository.js";
import { refreshTokenRepository } from "../repositories/refreshTokenRepository.js";
import type { signupRequest } from "../types/user.types.js";
import { toPublicUser } from "./mappers/userMapper.js";

const isValidString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export class UserService {
  constructor(
    private users = userRepository,
    private refreshTokens = refreshTokenRepository,
  ) {}

  async register(signupRequest: signupRequest) {
    if (
      !isValidString(signupRequest.username) ||
      !isValidString(signupRequest.email) ||
      !isValidString(signupRequest.password)
    ) {
      throw new BadRequestError("username, email and password are required");
    }

    const normalizedEmail = signupRequest.email.trim().toLowerCase();
    const normalizedUsername = signupRequest.username.trim();
    const sanitizedPassword = signupRequest.password.trim();

    const existingUser = await this.users.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new ConflictError("Email already in use");
    }

    const hashedPassword = await hashPassword(sanitizedPassword);
    const user = await this.users.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const accessToken = makeAccessToken(user.id);
    const refreshToken = generateRefreshToken();
    await this.refreshTokens.create(user.id, refreshToken);

    return {
      user: toPublicUser(user),
      token: accessToken,
      refreshToken,
    };
  }
}

export const userService = new UserService();
