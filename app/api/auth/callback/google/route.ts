import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Code manquant" }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:3000/api/auth/callback/google"
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    const refresh_token = tokens.refresh_token;

    return NextResponse.json({
      message: "Authentification réussie !",
      refresh_token: refresh_token,
    });
  } catch (error) {
    console.error("Erreur lors de l'échange du code:", error);
    return NextResponse.json(
      { error: "Erreur d'authentification" },
      { status: 500 }
    );
  }
}
