import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const SESSION_COOKIE = "sid";
const ONE_YEAR = 60 * 60 * 24 * 365;

export default clerkMiddleware((auth, req) => {
  // Create a response we can attach cookies to
  const res = NextResponse.next();

  // If no anonymous session id exists, set one
  const existing = req.cookies.get(SESSION_COOKIE)?.value;
  if (!existing) {
    // crypto.randomUUID() works in middleware runtime
    const sid = crypto.randomUUID();

    res.cookies.set(SESSION_COOKIE, sid, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: ONE_YEAR,
    });
  }

  return res;
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
