import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Agent from "@/lib/models/Agent";
import Profile from "@/lib/models/Profile";
import { successResponse, errorResponse, extractApiKey } from "@/lib/utils/api-helpers";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return errorResponse(
        "Authentication required",
        "Include your API key as: Authorization: Bearer merit_xxx",
        401
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse("Invalid profile ID", "Provide a valid MongoDB ObjectId", 400);
    }

    await connectToDatabase();

    const agent = await Agent.findOne({ apiKey });
    if (!agent) {
      return errorResponse("Invalid API key", "Register to get an API key", 401);
    }

    const profile = await Profile.findById(id).lean();
    if (!profile) {
      return errorResponse("Profile not found", undefined, 404);
    }

    return successResponse({ profile });
  } catch (err: unknown) {
    console.error("Get profile error:", err);
    return errorResponse("Failed to fetch profile", undefined, 500);
  }
}
