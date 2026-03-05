import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import ActivityLog from "@/lib/models/ActivityLog";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function GET(_request: NextRequest) {
  try {
    await connectToDatabase();

    const logs = await ActivityLog.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return successResponse({ logs });
  } catch (err: unknown) {
    console.error("Activity log error:", err);
    return errorResponse("Failed to fetch activity log", undefined, 500);
  }
}
