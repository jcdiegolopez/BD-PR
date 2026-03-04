import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";

export async function GET(request) {
  const auth = getAuthUserFromRequest(request);

  if (!auth.authenticated) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  return NextResponse.json({ user: auth.user });
}