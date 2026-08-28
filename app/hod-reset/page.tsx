"use client";

import { useState } from "react";

export default function HodReset() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert("Please enter a username.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "https://sbs-sso-api.guntassandhu.com/internal/sso/generate-reset-code",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: username.trim(),
            apiKey: "asnjhijcs",
          }),
        },
      );

      const data = await response.json();
      if (response.ok && data.success) {
        alert(`Reset Code: ${data.resetCode}`);
      } else {
        alert(`Error: ${data.message || "Failed to generate reset code."}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message || "An unexpected error occurred."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "40px",
        fontFamily: "sans-serif",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      <h2>HOD Reset Code Generator</h2>
      <p style={{ color: "#666", fontSize: "14px" }}>
        Testing utility to generate a password reset code for any user.
      </p>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "12px" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label
            htmlFor="username"
            style={{ fontWeight: "bold", fontSize: "14px" }}
          >
            Username
          </label>
          <input
            id="username"
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: "10px",
              fontSize: "16px",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px",
            fontSize: "16px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Generating..." : "Generate Reset Code"}
        </button>
      </form>
    </div>
  );
}
