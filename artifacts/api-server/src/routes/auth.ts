import crypto from "crypto";
import { Router, type IRouter, type Request, type Response } from "express";
import { GetCurrentAuthUserResponse } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import {
  clearSession,
  getSessionId,
  createSession,
  SESSION_COOKIE,
  SESSION_TTL,
  type SessionData,
} from "../lib/auth";

const router: IRouter = Router();

function getOrigin(req: Request): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host =
    req.headers["x-forwarded-host"] || req.headers["host"] || "localhost";
  return `${proto}://${host}`;
}

function setSessionCookie(res: Response, sid: string) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

function setTempCookie(res: Response, name: string, value: string) {
  res.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60 * 1000,
  });
}

function getSafeReturnTo(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/";
  }
  return value;
}

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

async function upsertUser(githubUser: GitHubUser) {
  const nameParts = (githubUser.name ?? githubUser.login).split(" ");
  const firstName = nameParts[0] ?? null;
  const lastName = nameParts.slice(1).join(" ") || null;

  const userData = {
    id: `gh_${githubUser.id}`,
    email: githubUser.email,
    firstName,
    lastName,
    profileImageUrl: githubUser.avatar_url,
  };

  const [user] = await db
    .insert(usersTable)
    .values(userData)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: { ...userData, updatedAt: new Date() },
    })
    .returning();
  return user;
}

router.get("/auth/user", (req: Request, res: Response) => {
  res.json(
    GetCurrentAuthUserResponse.parse({
      user: req.isAuthenticated() ? req.user : null,
    }),
  );
});

router.get("/login", (req: Request, res: Response) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send("GITHUB_CLIENT_ID is not configured");
    return;
  }

  const returnTo = getSafeReturnTo(req.query.returnTo);
  const state = crypto.randomBytes(16).toString("hex");
  const callbackUrl = `${getOrigin(req)}/api/callback`;

  setTempCookie(res, "oauth_state", state);
  setTempCookie(res, "return_to", returnTo);

  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("scope", "read:user user:email");
  url.searchParams.set("state", state);

  res.redirect(url.toString());
});

router.get("/callback", async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    const expectedState = req.cookies?.oauth_state as string | undefined;
    const returnTo = getSafeReturnTo(req.cookies?.return_to);

    res.clearCookie("oauth_state", { path: "/" });
    res.clearCookie("return_to", { path: "/" });

    if (!code || !state || state !== expectedState) {
      req.log.warn(
        { hasCode: !!code, hasState: !!state, stateMatch: state === expectedState },
        "OAuth state mismatch or missing code",
      );
      res.redirect("/api/login");
      return;
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      req.log.error("GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET not set");
      res.status(500).send("GitHub OAuth not configured");
      return;
    }

    const callbackUrl = `${getOrigin(req)}/api/callback`;

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
    });

    const tokenData = (await tokenRes.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };

    if (!tokenData.access_token) {
      req.log.error({ tokenData }, "GitHub token exchange failed");
      res.status(500).send(`GitHub token exchange failed: ${tokenData.error ?? "unknown"} — ${tokenData.error_description ?? ""}`);
      return;
    }

    const ghHeaders = {
      Authorization: `Bearer ${tokenData.access_token}`,
      "User-Agent": "DietTrack",
    };

    const userRes = await fetch("https://api.github.com/user", {
      headers: ghHeaders,
    });
    const githubUser = (await userRes.json()) as GitHubUser;

    if (!githubUser.id) {
      req.log.error({ githubUser }, "GitHub user fetch failed");
      res.status(500).send("Failed to fetch GitHub user info");
      return;
    }

    if (!githubUser.email) {
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: ghHeaders,
      });
      const emails = (await emailRes.json()) as GitHubEmail[];
      const primary = emails.find((e) => e.primary && e.verified);
      if (primary) githubUser.email = primary.email;
    }

    const dbUser = await upsertUser(githubUser);

    const sessionData: SessionData = {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl,
      },
      access_token: tokenData.access_token,
    };

    const sid = await createSession(sessionData);
    setSessionCookie(res, sid);
    res.redirect(returnTo);
  } catch (err) {
    req.log.error({ err }, "OAuth callback crashed");
    res.status(500).send(`Login error: ${err instanceof Error ? err.message : String(err)}`);
  }
});

router.get("/logout", async (req: Request, res: Response) => {
  const sid = getSessionId(req);
  await clearSession(res, sid);
  res.redirect("/");
});

export default router;
