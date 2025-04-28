import { google } from "googleapis";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Configurez les credentials
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Créez le client Calendar
const calendar = google.calendar({ version: "v3", auth: oauth2Client });

export async function createGoogleMeet(
  title: string,
  startTime: Date,
  duration: number = 60
) {
  try {
    const endTime = new Date(startTime.getTime() + duration * 60000);

    const event = {
      summary: title,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: "Europe/Paris",
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: "Europe/Paris",
      },
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      conferenceDataVersion: 1,
      requestBody: event,
    });

    // Retourner le lien Google Meet
    return response.data.conferenceData?.entryPoints?.[0]?.uri || null;
  } catch (error) {
    console.error(
      "Erreur lors de la création de la réunion Google Meet:",
      error
    );
    throw error;
  }
}
