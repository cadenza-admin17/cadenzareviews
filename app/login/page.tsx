"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
  setLoading(true);
  setMessage("");

  const redirectUrl = `${window.location.origin}/dashboard`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUrl },
  });

  if (error) setMessage(error.message);

  setLoading(false);
};


  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#f0f0f0" }}>
      <div style={{ padding: "2rem", background: "white", borderRadius: "8px", boxShadow: "0 0 10px rgba(0,0,0,0.1)", width: "300px" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Cadenza Login</h1>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "none", background: "#4285F4", color: "white", cursor: "pointer", marginBottom: "1rem" }}
        >
          {loading ? "Redirecting…" : "Sign in with Google"}
        </button>

        {message && <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#555" }}>{message}</p>}
      </div>
    </div>
  );
}
