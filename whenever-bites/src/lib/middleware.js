import { NextResponse } from "next/server";
import { getAuthUserFromRequest } from "@/lib/auth";

export function requireAuth(request) {
  const auth = getAuthUserFromRequest(request);

  if (!auth.authenticated) {
    return {
      ok: false,
      user: null,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }

  return {
    ok: true,
    user: auth.user,
    response: null,
  };
}

export function requireRole(request, allowedRoles = []) {
  const authResult = requireAuth(request);
  if (!authResult.ok) {
    return authResult;
  }

  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return authResult;
  }

  if (!allowedRoles.includes(authResult.user.rol)) {
    return {
      ok: false,
      user: authResult.user,
      response: NextResponse.json({ error: "Prohibido" }, { status: 403 }),
    };
  }

  return authResult;
}

export function withRole(handler, allowedRoles = []) {
  return async function roleProtectedHandler(request, context) {
    const authResult = requireRole(request, allowedRoles);
    if (!authResult.ok) {
      return authResult.response;
    }

    return handler(request, context, authResult.user);
  };
}
