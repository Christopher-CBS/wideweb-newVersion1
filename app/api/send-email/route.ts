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
    const reservationsFile = path.resolve(process.cwd(), "reservations.json");
    let reservations: { date: string }[] = [];

    // Lire le fichier de réservations (ou le créer s'il n'existe pas)
    if (fs.existsSync(reservationsFile)) {
      const fileContent = fs.readFileSync(reservationsFile, "utf-8");
      reservations = fileContent ? JSON.parse(fileContent) : [];
    }

    // Compter le nombre de réservations pour la date demandée
    const countForDate = reservations.filter(
      (r) => r.date === data.selectedDate
    ).length;
    if (countForDate >= 5) {
      return NextResponse.json(
        {
          message:
            "Le nombre maximum de réservations pour cette date est atteint. Veuillez choisir une autre date.",
          error: true,
        },
        { status: 400 }
      );
    }

    // Ajouter la réservation
    reservations.push({ date: data.selectedDate });
    fs.writeFileSync(
      reservationsFile,
      JSON.stringify(reservations, null, 2),
      "utf-8"
    );

    // Gérer l'upload des fichiers (sauvegarde dans /public/uploads)
    let uploadedFiles: { name: string; url: string }[] = [];
    if (data.files && data.files.length > 0) {
      const uploadsDir = path.resolve(process.cwd(), "public/uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      for (const file of data.files) {
        if (file.content && file.name) {
          // Extraire l'extension
          const ext = path.extname(file.name);
          // Nettoyer le nom du fichier
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
          const filePath = path.join(uploadsDir, safeName);
          // Décoder le contenu base64
          const base64 = file.content.split(",").pop();
          const buffer = Buffer.from(base64, "base64");
          fs.writeFileSync(filePath, new Uint8Array(buffer));
          uploadedFiles.push({
            name: file.name,
            url: `/uploads/${safeName}`,
          });
        }
      }
    }

    // Générer le lien de réunion seulement si une plateforme est sélectionnée
    let meetingLink = "";
    if (data.meetingPlatform && data.meetingPlatform !== "none") {
      meetingLink = generateMeetingLink(
        data.meetingPlatform,
        data.selectedDate,
        data.firstName,
        data.lastName
      );
    }

    // Email pour le client (NOUVEAU DESIGN ÉPURÉ, MODERNE, COMPATIBLE GMAIL)
    const clientEmailTemplate = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmation de votre demande</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="margin:0;padding:0;background:#f6f8fa;font-family:'Inter',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;padding:0;margin:0;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(31,41,55,0.07);border:1px solid #e5e7eb;overflow:hidden;">
                  <tr>
                    <td style="padding:32px 24px 16px 24px;text-align:center;">
                      <img src="https://cdn-icons-png.flaticon.com/512/561/561127.png" width="64" height="64" alt="Confirmation" style="margin-bottom:16px;border-radius:12px;box-shadow:0 2px 8px #e0e7ff;"/>
                      <h1 style="font-size:22px;font-weight:700;color:#18181b;margin:0 0 8px 0;">Merci pour votre demande, ${
                        data.firstName
                      } 👋</h1>
                      <div style="color:#64748b;font-size:15px;margin-bottom:18px;">Nous avons bien reçu votre demande et nous vous recontactons très vite !</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 24px 24px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;border-radius:12px;padding:0 0 0 0;">
                        <tr>
                          <td style="padding:18px 16px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;padding-bottom:2px;">Date du rendez-vous</td>
                              </tr>
                              <tr>
                                <td style="font-size:16px;font-weight:600;color:#18181b;padding-bottom:10px;">
                                  ${new Date(
                                    data.selectedDate
                                  ).toLocaleDateString("fr-FR", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </td>
                              </tr>
                              <tr>
                                <td style="font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;padding-bottom:2px;">Services demandés</td>
                              </tr>
                              <tr>
                                <td style="padding-bottom:10px;">
                                  ${data.serviceTypes
                                    .map(
                                      (service: string) =>
                                        `<span style="display:inline-block;background:#e0e7ff;color:#3730a3;font-size:13px;font-weight:600;padding:4px 12px;border-radius:8px;margin-right:8px;margin-bottom:4px;">${service}</span>`
                                    )
                                    .join("")}
                                </td>
                              </tr>
                              ${
                                data.budget
                                  ? `
                              <tr>
                                <td style="font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;padding-bottom:2px;">Budget estimé</td>
                              </tr>
                              <tr>
                                <td style="font-size:15px;color:#059669;font-weight:600;padding-bottom:10px;">${data.budget}€</td>
                              </tr>
                              `
                                  : ""
                              }
                              ${
                                data.deadline
                                  ? `
                              <tr>
                                <td style="font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;padding-bottom:2px;">Date limite souhaitée</td>
                              </tr>
                              <tr>
                                <td style="font-size:15px;color:#dc2626;font-weight:600;padding-bottom:10px;">${data.deadline}</td>
                              </tr>
                              `
                                  : ""
                              }
                            </table>
                          </td>
                        </tr>
                      </table>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
                        <tr>
                          <td style="font-size:15px;font-weight:700;color:#18181b;padding-bottom:6px;">Vos informations</td>
                        </tr>
                        <tr>
                          <td style="font-size:15px;color:#334155;line-height:1.7;">
                            <b>Nom :</b> ${data.firstName} ${data.lastName}<br>
                            <b>Email :</b> <a href="mailto:${
                              data.email
                            }" style="color:#6366f1;text-decoration:none;">${
      data.email
    }</a><br>
                            <b>Téléphone :</b> ${data.phone}<br>
                            ${
                              data.company
                                ? `<b>Entreprise :</b> ${data.company}<br>`
                                : ""
                            }
                          </td>
                        </tr>
                      </table>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
                        <tr>
                          <td style="font-size:15px;font-weight:700;color:#18181b;padding-bottom:6px;">Description du projet</td>
                        </tr>
                        <tr>
                          <td style="font-size:15px;color:#334155;line-height:1.7;white-space:pre-line;">${
                            data.projectDescription
                          }</td>
                        </tr>
                      </table>
                      ${
                        data.files && data.files.length > 0
                          ? `
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
                        <tr>
                          <td style="font-size:15px;font-weight:700;color:#18181b;padding-bottom:6px;">Fichiers joints (${
                            data.files.length
                          })</td>
                        </tr>
                        <tr>
                          <td>
                            ${data.files
                              .map(
                                (file: { name: string; url?: string }) =>
                                  `<div style="margin-bottom:6px;"><span style="font-size:16px;">📎</span> <span style="font-size:15px;">${file.name}</span></div>`
                              )
                              .join("")}
                          </td>
                        </tr>
                      </table>
                      `
                          : ""
                      }
                      ${
                        data.meetingPlatform && meetingLink
                          ? `
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
                        <tr>
                          <td style="font-size:15px;font-weight:700;color:#18181b;padding-bottom:6px;">Lien de la réunion</td>
                        </tr>
                        <tr>
                          <td style="font-size:15px;">
                            <a href="${meetingLink}" style="color:#059669;text-decoration:none;font-weight:600;word-break:break-all;">${meetingLink}</a>
                          </td>
                        </tr>
                      </table>
                      `
                          : ""
                      }
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                        <tr>
                          <td style="background:#e0e7ff;color:#3730a3;text-align:center;font-size:15px;font-weight:600;padding:16px 8px;border-radius:10px;">
                            Notre équipe vous contactera prochainement pour finaliser votre projet.<br>Merci pour votre confiance !
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Email pour l'administrateur (NOUVEAU DESIGN ÉPURÉ, MODERNE, IDENTIQUE À CELUI DU CLIENT)
    const adminEmailTemplate = `
      <!DOCTYPE html>
      <html lang="fr">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nouvelle demande de projet</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
        </head>
        <body style="margin:0;padding:0;background:#f6f8fa;font-family:'Inter',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;padding:0;margin:0;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;box-shadow:0 2px 12px rgba(31,41,55,0.07);border:1px solid #e5e7eb;overflow:hidden;">
                  <tr>
                    <td style="padding:32px 24px 16px 24px;text-align:center;">
                      <img src="https://cdn-icons-png.flaticon.com/512/561/561127.png" width="64" height="64" alt="Demande" style="margin-bottom:16px;border-radius:12px;box-shadow:0 2px 8px #e0e7ff;"/>
                      <h1 style="font-size:22px;font-weight:700;color:#18181b;margin:0 0 8px 0;">Nouvelle demande de projet reçue</h1>
                      <div style="color:#64748b;font-size:15px;margin-bottom:18px;">Un client vient de soumettre une demande via le formulaire Wide Web Agency.</div>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 24px 24px 24px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fa;border-radius:12px;">
                        <tr>
                          <td style="padding:18px 16px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;padding-bottom:2px;">Date du rendez-vous</td>
                              </tr>
                              <tr>
                                <td style="font-size:16px;font-weight:600;color:#18181b;padding-bottom:10px;">
                                  ${new Date(
                                    data.selectedDate
                                  ).toLocaleDateString("fr-FR", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                  })}
                                </td>
                              </tr>
                              <tr>
                                <td style="font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;padding-bottom:2px;">Services demandés</td>
                              </tr>
                              <tr>
                                <td style="padding-bottom:10px;">
                                  ${data.serviceTypes
                                    .map(
                                      (service: string) =>
                                        `<span style="display:inline-block;background:#e0e7ff;color:#3730a3;font-size:13px;font-weight:600;padding:4px 12px;border-radius:8px;margin-right:8px;margin-bottom:4px;">${service}</span>`
                                    )
                                    .join("")}
                                </td>
                              </tr>
                              ${
                                data.budget
                                  ? `
                              <tr>
                                <td style="font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;padding-bottom:2px;">Budget estimé</td>
                              </tr>
                              <tr>
                                <td style="font-size:15px;color:#059669;font-weight:600;padding-bottom:10px;">${data.budget}€</td>
                              </tr>
                              `
                                  : ""
                              }
                              ${
                                data.deadline
                                  ? `
                              <tr>
                                <td style="font-size:13px;color:#94a3b8;font-weight:600;text-transform:uppercase;padding-bottom:2px;">Date limite souhaitée</td>
                              </tr>
                              <tr>
                                <td style="font-size:15px;color:#dc2626;font-weight:600;padding-bottom:10px;">${data.deadline}</td>
                              </tr>
                              `
                                  : ""
                              }
                            </table>
                          </td>
                        </tr>
                      </table>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
                        <tr>
                          <td style="font-size:15px;font-weight:700;color:#18181b;padding-bottom:6px;">Informations du client</td>
                        </tr>
                        <tr>
                          <td style="font-size:15px;color:#334155;line-height:1.7;">
                            <b>Nom :</b> ${data.firstName} ${data.lastName}<br>
                            <b>Email :</b> <a href="mailto:${
                              data.email
                            }" style="color:#6366f1;text-decoration:none;">${
      data.email
    }</a><br>
                            <b>Téléphone :</b> ${data.phone}<br>
                            ${
                              data.company
                                ? `<b>Entreprise :</b> ${data.company}<br>`
                                : ""
                            }
                          </td>
                        </tr>
                      </table>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
                        <tr>
                          <td style="font-size:15px;font-weight:700;color:#18181b;padding-bottom:6px;">Description du projet</td>
                        </tr>
                        <tr>
                          <td style="font-size:15px;color:#334155;line-height:1.7;white-space:pre-line;">${
                            data.projectDescription
                          }</td>
                        </tr>
                      </table>
                      ${
                        uploadedFiles.length > 0
                          ? `
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
                        <tr>
                          <td style="font-size:15px;font-weight:700;color:#18181b;padding-bottom:6px;">Fichiers joints (${
                            uploadedFiles.length
                          })</td>
                        </tr>
                        <tr>
                          <td>
                            ${uploadedFiles
                              .map(
                                (file) =>
                                  `<div style="margin-bottom:6px;"><span style="font-size:16px;">📎</span> <span style="font-size:15px;">${file.name}</span></div>`
                              )
                              .join("")}
                          </td>
                        </tr>
                      </table>
                      `
                          : ""
                      }
                      ${
                        data.meetingPlatform && meetingLink
                          ? `
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;">
                        <tr>
                          <td style="font-size:15px;font-weight:700;color:#18181b;padding-bottom:6px;">Lien de la réunion</td>
                        </tr>
                        <tr>
                          <td style="font-size:15px;">
                            <a href="${meetingLink}" style="color:#059669;text-decoration:none;font-weight:600;word-break:break-all;">${meetingLink}</a>
                          </td>
                        </tr>
                      </table>
                      `
                          : ""
                      }
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                        <tr>
                          <td style="background:#e0e7ff;color:#3730a3;text-align:center;font-size:15px;font-weight:600;padding:16px 8px;border-radius:10px;">
                            Merci de traiter cette demande dans les meilleurs délais.<br>Wide Web Agency.
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Log des fichiers à attacher
    if (uploadedFiles.length > 0) {
      console.log(
        "Fichiers joints à envoyer :",
        uploadedFiles.map((f) => ({
          name: f.name,
          path: path.resolve(
            process.cwd(),
            "public",
            "uploads",
            f.name.replace(/[^a-zA-Z0-9._-]/g, "_")
          ),
        }))
      );
    } else {
      console.log("Aucun fichier à joindre à l'email administrateur.");
    }

    // Envoyer l'email de confirmation au client
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

    // Envoyer l'email à l'administrateur
    await transporter.sendMail({
      from: {
        name: `${data.firstName} ${data.lastName}`,
        address: process.env.EMAIL_USER as string,
      },
      to: process.env.EMAIL_RECEIVER || process.env.EMAIL_USER,
      subject: `✨ Nouvelle demande de projet de ${data.firstName} ${data.lastName}`,
      html: adminEmailTemplate,
      replyTo: data.email,
      attachments: uploadedFiles.map((file) => ({
        filename: file.name,
        path: path.resolve(
          process.cwd(),
          "public",
          "uploads",
          file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
        ),
      })),
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
