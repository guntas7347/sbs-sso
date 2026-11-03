import { Client } from "@/lib/clients";
import { SessionUserData } from "./SessionProfileCard";
import { BrandSection } from "./BrandSection";

export default function LeftSection({
  sessionUser,
  isUnregisteredChild,
  isValidRequest,
  isRegisteredClient,
  currentClient,
  appDisplayName,
}: {
  sessionUser: SessionUserData | null;
  isUnregisteredChild: boolean;
  isValidRequest: boolean;
  isRegisteredClient: boolean;
  currentClient: Client | null;
  appDisplayName: string;
}) {
  return (
    <BrandSection
      badgeText={
        sessionUser
          ? "Active SSO Session (30 Days)"
          : isUnregisteredChild
            ? "External Authorization"
            : isValidRequest
              ? "Official Portal Gate"
              : "Security Gateway"
      }
      titlePrefix={
        sessionUser
          ? "Unified Gateway"
          : isValidRequest
            ? "Connecting You to"
            : "Single Sign-On"
      }
      titleGradient={
        sessionUser && !isValidRequest
          ? "Portal Hub"
          : appDisplayName || "Central Identity"
      }
      description={
        sessionUser
          ? "Your centralized SSO session is active. Choose an authorized live university portal below to continue with your verified credentials."
          : isRegisteredClient && currentClient?.description
            ? `Sign in with your centralized credentials to access ${currentClient.name}. ${currentClient.description}.`
            : isUnregisteredChild
              ? `Sign in with your centralized credentials to authorize ${appDisplayName} (Unregistered Child).`
              : "Shaheed Bhagat Singh State University SSO provides secure and unified authentication. Select an authorized campus application below to begin sign-in."
      }
      statusText={
        sessionUser
          ? "SSO Session Valid (30 Days)"
          : isUnregisteredChild
            ? "External client gateway handshake active"
            : "All authentication gateways are fully operational"
      }
      securityGuideline={
        sessionUser
          ? "Always log out when using public or shared computers."
          : "Never disclose your university credentials to anyone."
      }
    />
  );
}
