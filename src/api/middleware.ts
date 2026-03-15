import type { NextFunction, Request, Response } from "express";

import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "./errors.js";
import { respondWithError } from "./json.js";

export function middlewareErrorLogger(
  err: unknown,
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const errorMessage = err instanceof Error ? err.message : "Unknown error";
  const payload: Record<string, unknown> = {
    method: req.method,
    path: req.originalUrl,
    message: errorMessage,
  };

  if (err instanceof Error && err.stack) {
    payload.stack = err.stack;
  }

  console.error("[Error]", payload);

  next(err);
}

export function middlewareErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  let statusCode = 500;
  let message = "Something went wrong";

  if (err instanceof BadRequestError) {
    statusCode = 400;
    message = err.message;
  } else if (err instanceof UnauthorizedError) {
    statusCode = 401;
    message = err.message;
  } else if (err instanceof ForbiddenError) {
    statusCode = 403;
    message = err.message;
  } else if (err instanceof NotFoundError) {
    statusCode = 404;
    message = err.message;
  } else if (err instanceof ConflictError) {
    statusCode = 409;
    message = err.message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  respondWithError(res, statusCode, message);
}
