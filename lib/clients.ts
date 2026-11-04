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
    description: "Digital forms and submissions for SBS State University.",
    logo: "sbssu-logo.png",
    live: true,
    redirectUri: "https://forms.sbssu.ac.in/api/auth/callback",
  },
  grievance: {
    name: "Grievance Portal",
    description: "Submit and track university grievance requests.",
    logo: "sbssu-logo.png",
    live: true,
    redirectUri: "https://grievances.sbssu.ac.in/api/auth/callback",
  },

  "grievance-dev": {
    name: "Grievance Portal LOCALHOST",
    description: "Submit and track university grievance requests.",
    logo: "sbssu-logo.png",
    live: false,
    redirectUri: "http://localhost:3000/api/auth/callback",
  },

  "grievance-dev-live": {
    name: "Grievance Portal GUNTASSANDHU",
    description: "Submit and track university grievance requests.",
    logo: "sbssu-logo.png",
    live: false,
    redirectUri: "https://majorprojct.guntassandhu.com/api/auth/callback",
  },
} as const satisfies Record<string, Client>;

export type ClientId = keyof typeof clients;
