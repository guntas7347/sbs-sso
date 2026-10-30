// lib/clients.ts

export type Client = {
  name: string;
  description: string;
  logo: string;
  redirectUri: string;
  live: boolean;
};

export const clients = {
  "sbs-form": {
    name: "SBS Form",
    description: "Google FORM like interface for students",
    logo: "/clients/grievance.png",
    live: true,
    redirectUri: "https://forms.sbssu.ac.in/api/auth/callback",
  },
  "sbs-form-dev": {
    name: "SBS FORM (DEVMODE)",
    description: "Google FORM like interface for students",
    logo: "/clients/grievance.png",
    live: false,
    redirectUri: "http://localhost:3001/api/auth/callback",
  },
  grievance: {
    name: "SBS Service Portal",
    description: "Submit and track university service requests",
    logo: "/clients/grievance.png",
    live: true,
    redirectUri: "https://grievance.sbssu.ac.in/api/auth/callback",
  },
  "grievance-dev": {
    name: "SBS Service Portal (DEVMODE)",
    description: "Submit and track university service requests",
    logo: "/clients/grievance.png",
    live: false,
    redirectUri: "http://localhost:3000/api/auth/callback",
  },
  "grievance-dev-live": {
    name: "SBS Service Portal (DEVMODE LIVE)",
    description: "Submit and track university service requests",
    logo: "/clients/grievance.png",
    live: false,
    redirectUri: "https://majorproject.guntassandhu.com/api/auth/callback",
  },
} as const satisfies Record<string, Client>;

export type ClientId = keyof typeof clients;
