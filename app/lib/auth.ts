import { getServerSession } from "next-auth/next";
import { verifyJwtToken } from "@/lib/auth";

export async function getSession() {
  return await getServerSession();
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export { verifyJwtToken }; 