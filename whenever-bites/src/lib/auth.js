import jwt from "jsonwebtoken";

const DEFAULT_EXPIRES_IN = "8h";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET no está definido en .env.local");
  }
  return secret;
}

export function signAccessToken(payload, options = {}) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: options.expiresIn || DEFAULT_EXPIRES_IN,
  });
}

export function verifyAccessToken(token) {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    return { valid: true, payload: decoded };
  } catch {
    return { valid: false, payload: null };
  }
}

export function getTokenFromRequest(request) {
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7).trim();
  }

  const cookieToken = request.cookies.get("token")?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

export function getAuthUserFromRequest(request) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return { authenticated: false, user: null };
  }

  const { valid, payload } = verifyAccessToken(token);
  if (!valid || !payload) {
    return { authenticated: false, user: null };
  }

  return {
    authenticated: true,
    user: {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
    },
  };
}
