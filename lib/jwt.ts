"use server";

import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export type AuthorizationCodePayload = {
  username: string;
  clientId?: string;
  redirectUri?: string;
  state?: string;
  codeChallenge?: string;
  isUnregistered?: boolean;
  user?: Record<string, unknown>;
};

export type SessionTokenPayload = {
  username: string;
  name?: string;
  user?: Record<string, unknown>;
  [key: string]: unknown;
};

export const verifyJwtToken = async (
  token: string,
): Promise<JwtPayload | null> => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

export const createAuthorizationCode = async (
  payload: AuthorizationCodePayload,
): Promise<string> => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: 60,
  });
};

export const createSessionToken = async (
  payload: SessionTokenPayload,
): Promise<string> => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "24h",
  });
};
