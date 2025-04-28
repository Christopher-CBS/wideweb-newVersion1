import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) {
    return NextResponse.json(
      { error: true, message: "Date manquante" },
      { status: 400 }
    );
  }
  const reservationsFile = path.resolve(process.cwd(), "reservations.json");
  let reservations: { date: string }[] = [];
  if (fs.existsSync(reservationsFile)) {
    const fileContent = fs.readFileSync(reservationsFile, "utf-8");
    reservations = fileContent ? JSON.parse(fileContent) : [];
  }
  const countForDate = reservations.filter((r) => r.date === date).length;
  return NextResponse.json({ count: countForDate });
}
