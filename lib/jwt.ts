"use server";

import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

type AuthorizationCodePayload = {
  username: string;
  clientId?: string;
  redirectUri?: string;
  state?: string;
  codeChallenge?: string;
  isUnregistered?: boolean;
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
    expiresIn: 30,
  });
};

export const createSessionToken = async (payload: {
  username: string;
  name?: string;
}): Promise<string> => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "24h",
  });
};


