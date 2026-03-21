import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Request, Response } from "express";

import { login } from "../api/auth.js";
import { signup } from "../api/users.js";
import { BadRequestError } from "../api/errors.js";

const userServiceMocks = vi.hoisted(() => ({
  userService: {
    register: vi.fn(),
  },
}));

const authServiceMocks = vi.hoisted(() => ({
  authService: {
    login: vi.fn(),
    refreshAccessToken: vi.fn(),
    logout: vi.fn(),
    verifyAccessToken: vi.fn(),
  },
}));

vi.mock("../services/userService.js", () => userServiceMocks);
vi.mock("../services/authService.js", () => authServiceMocks);
vi.mock("../auth.js", () => ({
  getBearerToken: vi.fn((req: Request) => req.headers?.authorization ?? ""),
}));

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

    userServiceMocks.userService.register.mockResolvedValueOnce({
      user: { id: "user-1", username: "alice", email: "alice@test.com" },
      token: "access-token",
      refreshToken: "refresh-token",
    });

    await signup(req, res);

    expect(userServiceMocks.userService.register).toHaveBeenCalledWith(
      req.body,
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

  it("surfacing errors from the service", async () => {
    const req = { body: { username: "", email: "", password: "" } } as Request;
    const res = createMockResponse();

    userServiceMocks.userService.register.mockRejectedValueOnce(
      new BadRequestError("username, email and password are required"),
    );

    await expect(signup(req, res)).rejects.toBeInstanceOf(BadRequestError);
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

    authServiceMocks.authService.login.mockResolvedValueOnce({
      user: {
        id: "user-1",
        username: "alice",
        email: "alice@test.com",
      },
      token: "access-token",
      refreshToken: "refresh-token",
    });

    await login(req, res);

    expect(authServiceMocks.authService.login).toHaveBeenCalledWith(req.body);
    expect(res.header).toHaveBeenCalledWith(
      "Content-Type",
      "application/json",
    );
    expect(res.status).toHaveBeenCalledWith(200);
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
});
});
