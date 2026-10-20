import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionByToken,
  type SessionContext
} from "@/lib/db";

export const SESSION_COOKIE_NAME = "np_session";

export async function getCurrentSession(): Promise<SessionContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return getSessionByToken(token);
}

export async function requireSession(): Promise<SessionContext> {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
