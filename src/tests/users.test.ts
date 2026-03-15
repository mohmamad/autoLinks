import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response } from "express";

import { login } from "../api/auth.js";
import { signup } from "../api/users.js";
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
} from "../api/errors.js";

const userQueryMocks = vi.hoisted(() => ({
  getUserByEmail: vi.fn(),
  createUser: vi.fn(),
  toPublicUser: vi.fn(),
}));

const refreshTokenMocks = vi.hoisted(() => ({
  addRefreshToken: vi.fn(),
  getRefreshTokenByValue: vi.fn(),
  revokeRefreshToken: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  hashPassword: vi.fn(),
  makeAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  verifyPassword: vi.fn(),
  getBearerToken: vi.fn(),
  validateAccessToken: vi.fn(),
}));

vi.mock("../db/queries/users.js", () => userQueryMocks);
vi.mock("../db/queries/refreshTokens.js", () => refreshTokenMocks);
vi.mock("../auth.js", () => authMocks);

function createMockResponse() {
  return {
    header: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Response & {
    header: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
    send: ReturnType<typeof vi.fn>;
  };
}

describe("signup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new user and returns tokens", async () => {
    const req = {
      body: { username: "alice", email: "alice@test.com", password: "pass" },
    } as Request;
    const res = createMockResponse();

    const createdUser = {
      id: "user-1",
      username: "alice",
      email: "alice@test.com",
      password: "hash",
    };

    userQueryMocks.getUserByEmail.mockResolvedValueOnce(null);
    authMocks.hashPassword.mockResolvedValueOnce("hashed-pass");
    userQueryMocks.createUser.mockResolvedValueOnce(createdUser);
    userQueryMocks.toPublicUser.mockReturnValueOnce({
      id: "user-1",
      username: "alice",
      email: "alice@test.com",
    });
    authMocks.makeAccessToken.mockReturnValueOnce("access-token");
    authMocks.generateRefreshToken.mockReturnValueOnce("refresh-token");

    await signup(req, res);

    expect(userQueryMocks.createUser).toHaveBeenCalledWith({
      username: "alice",
      email: "alice@test.com",
      password: "hashed-pass",
    });
    expect(refreshTokenMocks.addRefreshToken).toHaveBeenCalledWith(
      "user-1",
      "refresh-token",
    );
    expect(res.header).toHaveBeenCalledWith(
      "Content-Type",
      "application/json",
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      JSON.stringify({
        user: {
          id: "user-1",
          username: "alice",
          email: "alice@test.com",
        },
        token: "access-token",
        refreshToken: "refresh-token",
      }),
    );
  });

  it("throws when provided input is invalid", async () => {
    const req = { body: { username: "", email: "", password: "" } } as Request;
    const res = createMockResponse();

    await expect(signup(req, res)).rejects.toBeInstanceOf(BadRequestError);
  });

  it("rejects duplicate email addresses", async () => {
    const req = {
      body: { username: "alice", email: "alice@test.com", password: "pass" },
    } as Request;
    const res = createMockResponse();

    userQueryMocks.getUserByEmail.mockResolvedValueOnce({ id: "user-1" });

    await expect(signup(req, res)).rejects.toBeInstanceOf(ConflictError);
  });
});

describe("login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns auth tokens when credentials are correct", async () => {
    const req = {
      body: { email: "alice@test.com", password: "secret" },
    } as Request;
    const res = createMockResponse();

    const userRecord = {
      id: "user-1",
      username: "alice",
      email: "alice@test.com",
      password: "hash",
    };

    userQueryMocks.getUserByEmail.mockResolvedValueOnce(userRecord);
    authMocks.verifyPassword.mockResolvedValueOnce(true);
    authMocks.makeAccessToken.mockReturnValueOnce("access-token");
    authMocks.generateRefreshToken.mockReturnValueOnce("refresh-token");
    userQueryMocks.toPublicUser.mockReturnValueOnce({
      id: "user-1",
      username: "alice",
      email: "alice@test.com",
    });

    await login(req, res);

    expect(authMocks.verifyPassword).toHaveBeenCalledWith("secret", "hash");
    expect(refreshTokenMocks.addRefreshToken).toHaveBeenCalledWith(
      "user-1",
      "refresh-token",
    );
    expect(res.json).toHaveBeenCalledWith({
      user: {
        id: "user-1",
        username: "alice",
        email: "alice@test.com",
      },
      token: "access-token",
      refreshToken: "refresh-token",
    });
  });

  it("throws when email or password is missing", async () => {
    const req = { body: { email: "", password: "" } } as Request;
    const res = createMockResponse();

    await expect(login(req, res)).rejects.toBeInstanceOf(BadRequestError);
  });

  it("throws when credentials are invalid", async () => {
    const req = {
      body: { email: "alice@test.com", password: "secret" },
    } as Request;
    const res = createMockResponse();

    userQueryMocks.getUserByEmail.mockResolvedValueOnce(null);
  
    await expect(login(req, res)).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
