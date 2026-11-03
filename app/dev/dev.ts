"use server";

import { createCipheriv, randomBytes, randomUUID } from "node:crypto";

export type UserRole = "student" | "faculty" | "admin";

export interface SampleUser {
  id: string;
  username: string;
  fullName: string;
  fatherName: string;
  role: UserRole;
  email: string;

  degree: string;
  specialization: string;
  department: string;

  mobile: string;
  photo: string;

  rollNo: string | null;
  admissionYear: number | null;
  session: string;
  semester: number | null;

  designation: string;
  createdAt: string;
}

const sampleUsers: any = [
  {
    id: "usr_001",
    username: "235001",
    fullName: "Aarav Sharma",
    fatherName: "Rajesh Sharma",
    role: "student",
    email: "aarav.sharma@example.com",
    degree: "B.Tech",
    specialization: "Computer Science and Engineering",
    department: "Computer Science and Engineering",
    mobile: "9876543210",
    photo: "https://example.com/photos/235001.jpg",
    rollNo: "235001",
    admissionYear: 2023,
    session: "2023-2027",
    semester: 7,
    designation: "",
    createdAt: "2023-08-15T10:00:00Z",
  },
  {
    id: "usr_002",
    username: "235002",
    fullName: "Guntas Singh",
    fatherName: "Gurpreet Singh",
    role: "student",
    email: "guntas.singh@example.com",
    degree: "B.Tech",
    specialization: "Computer Science and Engineering",
    department: "Computer Science and Engineering",
    mobile: "9876543211",
    photo: "https://example.com/photos/235002.jpg",
    rollNo: "235002",
    admissionYear: 2023,
    session: "2023-2027",
    semester: 7,
    designation: "",
    createdAt: "2023-08-15T10:00:00Z",
  },
  {
    id: "usr_003",
    username: "235003",
    fullName: "Arjun Verma",
    fatherName: "Sandeep Verma",
    role: "student",
    email: "arjun.verma@example.com",
    degree: "B.Tech",
    specialization: "Computer Science and Engineering",
    department: "Computer Science and Engineering",
    mobile: "9876543212",
    photo: "https://example.com/photos/235003.jpg",
    rollNo: "235003",
    admissionYear: 2023,
    session: "2023-2027",
    semester: 7,
    designation: "",
    createdAt: "2023-08-15T10:00:00Z",
  },
  {
    id: "usr_004",
    username: "235004",
    fullName: "Simran Kaur",
    fatherName: "Harjit Singh",
    role: "student",
    email: "simran.kaur@example.com",
    degree: "B.Tech",
    specialization: "Electronics and Communication Engineering",
    department: "Electronics and Communication Engineering",
    mobile: "9876543213",
    photo: "https://example.com/photos/235004.jpg",
    rollNo: "235004",
    admissionYear: 2023,
    session: "2023-2027",
    semester: 7,
    designation: "",
    createdAt: "2023-08-15T10:00:00Z",
  },
  {
    id: "usr_005",
    username: "235005",
    fullName: "Rohan Gupta",
    fatherName: "Amit Gupta",
    role: "student",
    email: "rohan.gupta@example.com",
    degree: "B.Tech",
    specialization: "Mechanical Engineering",
    department: "Mechanical Engineering",
    mobile: "9876543214",
    photo: "https://example.com/photos/235005.jpg",
    rollNo: "235005",
    admissionYear: 2023,
    session: "2023-2027",
    semester: 7,
    designation: "",
    createdAt: "2023-08-15T10:00:00Z",
  },
  {
    id: "usr_006",
    username: "priya",
    fullName: "Priya Sharma",
    fatherName: "Vijay Sharma",
    role: "faculty",
    email: "priya.sharma@example.com",
    degree: "M.Tech",
    specialization: "Computer Science and Engineering",
    department: "Computer Science and Engineering",
    mobile: "9876543215",
    photo: "https://example.com/photos/faculty-priya.jpg",
    rollNo: null,
    admissionYear: null,
    session: "",
    semester: null,
    designation: "Assistant Professor",
    createdAt: "2022-07-01T10:00:00Z",
  },
  {
    id: "usr_007",
    username: "amandeep",
    fullName: "Amandeep Singh",
    fatherName: "Balwinder Singh",
    role: "faculty",
    email: "amandeep.singh@example.com",
    degree: "M.Tech",
    specialization: "Electronics and Communication Engineering",
    department: "Electronics and Communication Engineering",
    mobile: "9876543216",
    photo: "https://example.com/photos/faculty-amandeep.jpg",
    rollNo: null,
    admissionYear: null,
    session: "",
    semester: null,
    designation: "Assistant Professor",
    createdAt: "2022-07-01T10:00:00Z",
  },
  {
    id: "usr_008",
    username: "neha",
    fullName: "Neha Verma",
    fatherName: "Rajiv Verma",
    role: "faculty",
    email: "neha.verma@example.com",
    degree: "M.Tech",
    specialization: "Mechanical Engineering",
    department: "Mechanical Engineering",
    mobile: "9876543217",
    photo: "https://example.com/photos/faculty-neha.jpg",
    rollNo: null,
    admissionYear: null,
    session: "",
    semester: null,
    designation: "Associate Professor",
    createdAt: "2022-07-01T10:00:00Z",
  },
  {
    id: "usr_009",
    username: "admin",
    fullName: "System Administrator",
    fatherName: "",
    role: "admin",
    email: "admin@example.com",
    degree: "",
    specialization: "",
    department: "Administration",
    mobile: "9876543218",
    photo: "https://example.com/photos/admin.jpg",
    rollNo: null,
    admissionYear: null,
    session: "",
    semester: null,
    designation: "Administrator",
    createdAt: "2022-01-01T10:00:00Z",
  },
  {
    id: "usr_010",
    username: "235006",
    fullName: "Karan Gill",
    fatherName: "Manjit Singh",
    role: "student",
    email: "karan.gill@example.com",
    degree: "B.Tech",
    specialization: "Information Technology",
    department: "Information Technology",
    mobile: "9876543219",
    photo: "https://example.com/photos/235006.jpg",
    rollNo: "235006",
    admissionYear: 2023,
    session: "2023-2027",
    semester: 7,
    designation: "",
    createdAt: "2023-08-15T10:00:00Z",
  },
];

const prod = process.env.NEXT_PUBLIC_APP_ENV === "production";

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
  if (prod) throw Error("DEV MODE OFF");

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
    const url = `/api/auth/callback/?data=${encodeURIComponent(data)}`;

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
