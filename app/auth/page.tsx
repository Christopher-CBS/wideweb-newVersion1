"use client";

import { useEffect } from "react";

export default function AuthPage() {
  useEffect(() => {
    const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const REDIRECT_URI = "http://localhost:3000/api/auth/callback/google";

    const scope = encodeURIComponent(
      [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ].join(" ")
    );

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;

    // Rediriger vers l'URL d'authentification Google
    window.location.href = authUrl;
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Redirection vers Google...</h1>
        <p>
          Vous allez être redirigé vers la page d&apos;authentification Google.
        </p>
      </div>
    </div>
  );
}
