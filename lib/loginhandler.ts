"use server";

export interface SarthiLoginResponse {
  status: string;
  message: string;
  user?: Record<string, unknown>;
}

export async function loginWithSarthi(
  username: string,
  password: string,
): Promise<SarthiLoginResponse> {
  try {
    let apiUrl = process.env.SARTHI_API_URL;

    if (!apiUrl) {
      throw new Error("SARTHI_API_URL is not defined");
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://sbssu.ac.in",
      },
      body: JSON.stringify({
        username,
        password,
      }),
      cache: "no-store",
    });

    const data = (await response.json().catch(() => null)) as {
      status?: string;
      message?: string;
      user?: Record<string, unknown>;
    } | null;

    if (!data) {
      return {
        status: "error",
        message: `Authentication server returned status ${response.status} with invalid JSON response.`,
      };
    }

    return {
      status: String(data.status ?? (response.ok ? "success" : "failed")),
      message: String(
        data.message ??
          (response.ok ? "Authentication successful" : "Authentication failed"),
      ),
      user: data.user && typeof data.user === "object" ? data.user : undefined,
    };
  } catch (error: unknown) {
    console.error("Sarthi login error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to connect to authentication server. Please check your network or try again.";
    return {
      status: "error",
      message: errorMessage,
    };
  }
}
