import { generateSecret, generateSync, verifySync } from "otplib";

export const generateAuthenticatorSecret = (): string => {
  return generateSecret();
};

export const generateAuthenticatorToken = (secret: string): string => {
  return generateSync({ secret });
};

export const verifyAuthenticatorToken = (
  otp: string,
  secret: string,
): boolean => {
  // verifySync returns an object containing the 'valid' boolean
  const result = verifySync({ secret, token: otp });
  return result.valid;
};
