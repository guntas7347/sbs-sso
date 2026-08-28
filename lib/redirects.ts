// clients.ts

export const clients = {
  sarthi: {
    redirectUri: "https://sarthi.example.com/auth/callback",
  },
  "3QIDAQAB": {
    redirectUri: "https://majorproject.guntassandhu.com/login",
  },
} as const;

export type ClientId = keyof typeof clients;
