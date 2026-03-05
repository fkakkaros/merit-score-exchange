import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import ActivityLog from "@/lib/models/ActivityLog";
import mongoose from "mongoose";

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(error: string, hint?: string, status = 400) {
  return NextResponse.json(
    { success: false, error, ...(hint ? { hint } : {}) },
    { status }
  );
}

export function generateApiKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "merit_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateClaimToken(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "merit_claim_";
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function extractApiKey(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim();
}

export async function logActivity(
  agentId: unknown,
  agentName: string,
  action: string,
  details: string
): Promise<void> {
  try {
    await connectToDatabase();
    await ActivityLog.create({
      agentId: agentId as mongoose.Types.ObjectId,
      agentName,
      action,
      details,
    });
  } catch (err) {
    console.error("Failed to log activity:", err);
  }
}
