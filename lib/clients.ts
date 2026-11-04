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
    name: "SBS Forms",
    description: "Google FORM like interface for students",
    logo: "sbssu-logo.png",
    live: true,
    redirectUri: "https://forms.sbssu.ac.in/api/auth/callback",
  },
  grievance: {
    name: "Grievance Portal",
    description: "Submit and track university grievance requests",
    logo: "sbssu-logo.png",
    live: true,
    redirectUri: "https://grievances.sbssu.ac.in/api/auth/callback",
  },
} as const satisfies Record<string, Client>;

export type ClientId = keyof typeof clients;
