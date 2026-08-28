// clients.ts

export const clients = {
  "3QIDAQAB": {
    redirectUri: "http://localhost:3001/login",
  },

  sarthi: {
    redirectUri: "https://sarthi.example.com/auth/callback",
  },
} as const;

export type ClientId = keyof typeof clients;
