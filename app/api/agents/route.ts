import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Agent from "@/lib/models/Agent";
import Profile from "@/lib/models/Profile";
import { successResponse, errorResponse } from "@/lib/utils/api-helpers";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const [agents, total] = await Promise.all([
      Agent.find({})
        .sort({ lastActive: -1 })
        .skip(skip)
        .limit(limit)
        .select("-apiKey -claimToken -ownerEmail")
        .lean(),
      Agent.countDocuments({}),
    ]);

    // Get profile counts per agent
    const agentIds = agents.map((a) => a._id);
    const profileCounts = await Profile.aggregate([
      { $match: { agentId: { $in: agentIds } } },
      { $group: { _id: "$agentId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(profileCounts.map((p) => [String(p._id), p.count]));

    const enriched = agents.map((agent) => ({
      ...agent,
      profileCount: countMap.get(String(agent._id)) || 0,
    }));

    return successResponse({
      agents: enriched,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: unknown) {
    console.error("List agents error:", err);
    return errorResponse("Failed to fetch agents", undefined, 500);
  }
}
