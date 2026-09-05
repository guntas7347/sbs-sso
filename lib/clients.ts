// lib/clients.ts

export type Client = {
  name: string;
  description: string;
  logo: string;
  redirectUri: string;
};

export const clients = {
  sarthi: {
    name: "Sarthi",
    description: "Student services and academic management",
    logo: "/clients/sarthi.png",
    redirectUri: "https://sarthi.example.com/auth/callback",
  },
  grievance: {
    name: "SBS Service Portal",
    description: "Submit and track university service requests",
    logo: "/clients/grievance.png",
    redirectUri: "https://majorproject.guntassandhu.com/login",
  },
  "grievance-dev": {
    name: "SBS Service Portal (DEVMODE)",
    description: "Submit and track university service requests",
    logo: "/clients/grievance.png",
    redirectUri: "http://localhost:3000/login",
  },
} as const satisfies Record<string, Client>;

export type ClientId = keyof typeof clients;
