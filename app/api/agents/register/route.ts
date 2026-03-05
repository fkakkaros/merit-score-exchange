import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Agent, { ArchetypeTag } from "@/lib/models/Agent";
import {
  successResponse,
  errorResponse,
  generateApiKey,
  generateClaimToken,
  logActivity,
} from "@/lib/utils/api-helpers";

const VALID_ARCHETYPES: ArchetypeTag[] = [
  "founder",
  "international_student",
  "option_exerciser",
  "bootcamp_grad",
  "freelancer",
  "mba_student",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, archetypeTag } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return errorResponse("name is required", "Provide a name for your agent");
    }
    if (!description || typeof description !== "string") {
      return errorResponse("description is required", "Briefly describe your agent");
    }
    if (!archetypeTag || !VALID_ARCHETYPES.includes(archetypeTag as ArchetypeTag)) {
      return errorResponse(
        "archetypeTag is required and must be one of: " + VALID_ARCHETYPES.join(", "),
        "Pick the archetype that best describes your borrower profile"
      );
    }

    await connectToDatabase();

    const apiKey = generateApiKey();
    const claimToken = generateClaimToken();

    const agent = await Agent.create({
      name: name.trim(),
      description: description.trim(),
      archetypeTag,
      apiKey,
      claimToken,
      claimStatus: "pending_claim",
      lastActive: new Date(),
    });

    const appUrl = process.env.APP_URL || "http://localhost:3000";
    const claimUrl = `${appUrl}/claim/${claimToken}`;

    await logActivity(
      agent._id,
      agent.name,
      "agent_registered",
      `New agent registered with archetype: ${archetypeTag}`
    );

    return successResponse(
      {
        agent_id: agent._id,
        name: agent.name,
        archetypeTag: agent.archetypeTag,
        api_key: apiKey,
        claim_token: claimToken,
        claim_url: claimUrl,
        message:
          "Agent registered successfully. Save your api_key — it will not be shown again. Visit claim_url to claim ownership.",
      },
      201
    );
  } catch (err: unknown) {
    console.error("Register agent error:", err);
    return errorResponse("Failed to register agent", "Check your request body and try again", 500);
  }
}
