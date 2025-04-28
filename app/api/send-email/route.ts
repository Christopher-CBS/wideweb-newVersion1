import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createGoogleMeet } from "@/app/services/googleMeet";
import fs from "fs";
import path from "path";

// Fonction pour générer un lien de réunion
const generateMeetingLink = (
  platform: "zoom" | "meet",
  date: string,
  firstName: string,
  lastName: string
) => {
  if (platform === "zoom") {
    // Générer un ID Zoom de 10 chiffres
    const meetingId = Math.floor(Math.random() * 9000000000) + 1000000000;
    const password = new Date(date)
      .toISOString()
      .split("T")[0]
      .replace(/-/g, "");
    return `https://zoom.us/j/${meetingId}?pwd=${password}`;
  } else {
    // Format Google Meet : xxx-yyyy-zzz (exactement 3-4-3 lettres)
    const chars = "abcdefghijkmnpqrstuvwxyz"; // Exclusion de 'o' et 'l' pour éviter la confusion
    const generateCode = (length: number) => {
      let result = "";
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    const part1 = generateCode(3); // xxx
    const part2 = generateCode(4); // yyyy
    const part3 = generateCode(3); // zzz

    return `https://meet.google.com/${part1}-${part2}-${part3}`;
  }
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Génération du template email client (reprends ton code existant)
    const clientEmailTemplate = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmation de votre demande</title>
        </head>
        <body>
          <h1>Merci pour votre demande, ${data.firstName} !</h1>
          <p>Nous avons bien reçu votre demande et nous vous recontactons très vite !</p>
        </body>
      </html>
    `;

    // Génération du template email admin (reprends ton code existant)
    const adminEmailTemplate = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nouvelle demande de projet</title>
        </head>
        <body>
          <h1>Nouvelle demande de projet reçue</h1>
          <p>Un client vient de soumettre une demande via le formulaire Wide Web Agency.</p>
        </body>
      </html>
    `;

    // Envoi email client
    await transporter.sendMail({
      from: {
        name: "Wide Web Agency",
        address: process.env.EMAIL_USER as string,
      },
      to: data.email,
      subject: `✨ Confirmation de votre rendez-vous - ${new Date(
        data.selectedDate
      ).toLocaleDateString("fr-FR")}`,
      html: clientEmailTemplate,
    });

    // Envoi email admin
    await transporter.sendMail({
      from: {
        name: `${data.firstName} ${data.lastName}`,
        address: process.env.EMAIL_USER as string,
      },
      to: process.env.EMAIL_RECEIVER || process.env.EMAIL_USER,
      subject: `✨ Nouvelle demande de projet de ${data.firstName} ${data.lastName}`,
      html: adminEmailTemplate,
      replyTo: data.email,
    });

    return NextResponse.json(
      { message: "Emails envoyés avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de l'envoi des emails:", error);
    return NextResponse.json(
      { message: "Erreur lors de l'envoi des emails" },
      { status: 500 }
    );
  }
}
