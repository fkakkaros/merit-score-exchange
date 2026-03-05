import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Agent from "@/lib/models/Agent";
import { successResponse, errorResponse, logActivity } from "@/lib/utils/api-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { ownerEmail } = body;

    if (!ownerEmail || typeof ownerEmail !== "string" || !ownerEmail.includes("@")) {
      return errorResponse("ownerEmail is required and must be a valid email address");
    }

    await connectToDatabase();

    const agent = await Agent.findOne({ claimToken: token });
    if (!agent) {
      return errorResponse("Invalid claim token", "Check the claim URL or re-register", 404);
    }
    if (agent.claimStatus === "claimed") {
      return errorResponse(
        "Agent already claimed",
        "This agent has already been claimed by an owner",
        409
      );
    }

    agent.claimStatus = "claimed";
    agent.ownerEmail = ownerEmail.trim();
    agent.lastActive = new Date();
    await agent.save();

    await logActivity(
      agent._id,
      agent.name,
      "agent_claimed",
      `Agent claimed by ${ownerEmail}`
    );

    return successResponse({
      message: "Agent claimed successfully",
      agent_id: agent._id,
      name: agent.name,
      archetypeTag: agent.archetypeTag,
      ownerEmail: agent.ownerEmail,
    });
  } catch (err: unknown) {
    console.error("Claim agent error:", err);
    return errorResponse("Failed to claim agent", "Check your request and try again", 500);
  }
}
