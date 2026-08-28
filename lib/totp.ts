"use server";

import { generateSecret, generateSync, verifySync } from "otplib";

export const generateAuthenticatorSecret = async () => {
  return generateSecret();
};

export const generateAuthenticatorToken = async (secret: string) => {
  return generateSync({ secret });
};

export const verifyAuthenticatorToken = async (otp: string, secret: string) => {
  const result = verifySync({ secret, token: otp });
  return result.valid;
};
