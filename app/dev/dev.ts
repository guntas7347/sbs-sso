"use server";

import { createCipheriv, randomBytes, randomUUID } from "node:crypto";
import { redirect } from "next/navigation";

export interface SampleUser {
  id: string;
  Name: string;
  FathersName: string;
  email: string;
  Username: string;
  "Roll no": string | null;
  PhotoUrl: string | null;
  "Departure name": string;
  Role: string;
  [key: string]: unknown;
}

const sampleUsers: SampleUser[] = [
  {
    id: "usr_001",
    Name: "Aarav Sharma",
    FathersName: "Rajesh Sharma",
    email: "aarav.sharma@example.com",
    Username: "235001",
    "Roll no": "235001",
    PhotoUrl: "https://example.com/photos/235001.jpg",
    "Departure name": "Computer Science and Engineering",
    Role: "student",
  },
  {
    id: "usr_002",
    Name: "Guntas Singh",
    FathersName: "Gurpreet Singh",
    email: "guntas.singh@example.com",
    Username: "235002",
    "Roll no": "235002",
    PhotoUrl: "https://example.com/photos/235002.jpg",
    "Departure name": "Computer Science and Engineering",
    Role: "student",
  },
  {
    id: "usr_003",
    Name: "Arjun Verma",
    FathersName: "Sandeep Verma",
    email: "arjun.verma@example.com",
    Username: "235003",
    "Roll no": "235003",
    PhotoUrl: "https://example.com/photos/235003.jpg",
    "Departure name": "Computer Science and Engineering",
    Role: "student",
  },
  {
    id: "usr_004",
    Name: "Simran Kaur",
    FathersName: "Harjit Singh",
    email: "simran.kaur@example.com",
    Username: "235004",
    "Roll no": "235004",
    PhotoUrl: "https://example.com/photos/235004.jpg",
    "Departure name": "Electronics and Communication Engineering",
    Role: "student",
  },
  {
    id: "usr_005",
    Name: "Rohan Gupta",
    FathersName: "Amit Gupta",
    email: "rohan.gupta@example.com",
    Username: "235005",
    "Roll no": "235005",
    PhotoUrl: "https://example.com/photos/235005.jpg",
    "Departure name": "Mechanical Engineering",
    Role: "student",
  },
  {
    id: "usr_006",
    Name: "Priya Sharma",
    FathersName: "Vijay Sharma",
    email: "priya.sharma@example.com",
    Username: "priya",
    "Roll no": null,
    PhotoUrl: "https://example.com/photos/faculty-priya.jpg",
    "Departure name": "Computer Science and Engineering",
    Role: "faculty",
  },
  {
    id: "usr_007",
    Name: "Amandeep Singh",
    FathersName: "Balwinder Singh",
    email: "amandeep.singh@example.com",
    Username: "amandeep",
    "Roll no": null,
    PhotoUrl: "https://example.com/photos/faculty-amandeep.jpg",
    "Departure name": "Electronics and Communication Engineering",
    Role: "faculty",
  },
  {
    id: "usr_008",
    Name: "Neha Verma",
    FathersName: "Rajiv Verma",
    email: "neha.verma@example.com",
    Username: "neha",
    "Roll no": null,
    PhotoUrl: "https://example.com/photos/faculty-neha.jpg",
    "Departure name": "Mechanical Engineering",
    Role: "faculty",
  },
  {
    id: "usr_009",
    Name: "System Administrator",
    FathersName: "Not Applicable",
    email: "admin@example.com",
    Username: "admin",
    "Roll no": null,
    PhotoUrl: "https://example.com/photos/admin.jpg",
    "Departure name": "Administration",
    Role: "admin",
  },
  {
    id: "usr_010",
    Name: "Karan Gill",
    FathersName: "Manjit Singh",
    email: "karan.gill@example.com",
    Username: "235006",
    "Roll no": "235006",
    PhotoUrl: "https://example.com/photos/235006.jpg",
    "Departure name": "Information Technology",
    Role: "student",
  },
];

const DEFAULT_AAD = "sso.sbssu.ac.in";

export interface EncryptOptions {
  aad?: string;
  expirySeconds?: number;
}

function encryptSSOPayload(
  user: Record<string, unknown>,
  options?: EncryptOptions,
): {
  data: string;
  packageObject: { iv: string; tag: string; ciphertext: string };
  userData: Record<string, unknown>;
} {
  const keyConfig = process.env.SSO_DECRYPTION_KEY;
  if (!keyConfig) {
    throw new Error(
      "SSO_DECRYPTION_KEY is not defined in the server environment variables.",
    );
  }

  const base64Key = keyConfig.startsWith("base64:")
    ? keyConfig.slice(7)
    : keyConfig;
  const key = Buffer.from(base64Key, "base64");

  if (key.length !== 32) {
    throw new Error(
      `SSO_DECRYPTION_KEY must be exactly 32 bytes (decoded to ${key.length} bytes).`,
    );
  }

  const expiry = options?.expirySeconds ?? 300;
  const aad = options?.aad ?? DEFAULT_AAD;

  const username = String(
    user.username ||
      user.Username ||
      user.rollNo ||
      user["Roll no"] ||
      user.id ||
      "dev_user",
  ).trim();

  const name = String(
    user.name || user.Name || user.fullName || username,
  ).trim();

  const email = String(
    user.email || user.Email || `${username}@example.com`,
  ).trim();

  const role = String(user.role || user.Role || "student").trim();

  const userData: Record<string, unknown> = {
    ...user,
    username,
    name,
    email,
    role,
    exp: Math.floor(Date.now() / 1000) + expiry,
    jti: randomUUID(),
  };

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));

  const plaintext = Buffer.from(JSON.stringify(userData), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  const packageObject = {
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  };

  const data = Buffer.from(JSON.stringify(packageObject), "utf8").toString(
    "base64url",
  );

  return {
    data,
    packageObject,
    userData,
  };
}

export async function getSampleUsers(): Promise<SampleUser[]> {
  return sampleUsers;
}

export async function generateDevSSOCallback(
  user: Record<string, unknown>,
  callbackBaseUrl?: string,
  options?: EncryptOptions,
): Promise<{
  success: boolean;
  url?: string;
  data?: string;
  payload?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const { data, userData } = encryptSSOPayload(user, options);
    const baseUrl = callbackBaseUrl?.trim() || "/api/auth/callback";
    const separator = baseUrl.includes("?") ? "&" : "?";
    const url = `${baseUrl}${separator}data=${encodeURIComponent(data)}`;

    return {
      success: true,
      url,
      data,
      payload: userData,
    };
  } catch (err) {
    console.error("Error generating SSO dev payload:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to generate payload",
    };
  }
}

export async function callDevSSO(
  user: Record<string, unknown>,
  callbackBaseUrl?: string,
  options?: EncryptOptions,
): Promise<never> {
  const result = await generateDevSSOCallback(user, callbackBaseUrl, options);
  if (!result.success || !result.url) {
    throw new Error(result.error || "Failed to generate callback URL");
  }
  redirect(result.url);
}
