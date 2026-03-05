import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import Agent from "@/lib/models/Agent";
import Profile from "@/lib/models/Profile";
import { successResponse, errorResponse, extractApiKey, logActivity } from "@/lib/utils/api-helpers";

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function generateNotes(
  credentialScore: number,
  trajectoryScore: number,
  recoveryScore: number,
  meritScore: number,
  approved: boolean,
  annualIncome: number,
  debtAmount: number,
  purpose: string
): string {
  const debtToIncomeRatio = annualIncome > 0 ? (debtAmount / annualIncome) * 100 : 999;
  const dtiNote =
    debtToIncomeRatio < 30
      ? "a healthy debt-to-income ratio"
      : debtToIncomeRatio < 60
      ? "a moderate debt-to-income ratio"
      : "a high debt-to-income ratio";

  const credentialLabel =
    credentialScore >= 80 ? "strong" : credentialScore >= 50 ? "moderate" : "limited";
  const trajectoryLabel =
    trajectoryScore >= 80 ? "excellent" : trajectoryScore >= 50 ? "steady" : "uncertain";
  const recoveryLabel =
    recoveryScore >= 80 ? "robust" : recoveryScore >= 50 ? "adequate" : "thin";

  const scoreBreakdown = `Credential score: ${credentialScore}/100 (${credentialLabel} credentials, weighted 30%). Trajectory score: ${trajectoryScore}/100 (${trajectoryLabel} career path, weighted 40%). Recovery score: ${recoveryScore}/100 (${recoveryLabel} safety net, weighted 30%).`;

  const decision = approved
    ? `The applicant's Merit Score of ${meritScore.toFixed(1)} meets the approval threshold of 60. Credit request for "${purpose}" is APPROVED.`
    : `The applicant's Merit Score of ${meritScore.toFixed(1)} falls below the approval threshold of 60. Credit request for "${purpose}" is DENIED.`;

  const recommendation = approved
    ? "Recommended for credit at standard terms."
    : credentialScore < 50
    ? "Applicant should focus on building verifiable credentials (degrees, certifications, or professional recognition) before reapplying."
    : trajectoryScore < 50
    ? "Applicant's career trajectory needs strengthening — consistent income growth or employer stability would significantly improve eligibility."
    : "Applicant should reduce existing debt obligations and build a stronger financial safety net before reapplying.";

  return `${decision} ${scoreBreakdown} Debt-to-income analysis shows ${dtiNote} (${debtToIncomeRatio.toFixed(0)}%). ${recommendation}`;
}

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const skip = (page - 1) * limit;

    const [profiles, total] = await Promise.all([
      Profile.find({})
        .sort({ meritScore: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Profile.countDocuments({}),
    ]);

    return successResponse({
      profiles,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err: unknown) {
    console.error("List profiles error:", err);
    return errorResponse("Failed to fetch profiles", undefined, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = extractApiKey(request);
    if (!apiKey) {
      return errorResponse(
        "Authentication required",
        "Include your API key as: Authorization: Bearer merit_xxx",
        401
      );
    }

    await connectToDatabase();

    const agent = await Agent.findOne({ apiKey });
    if (!agent) {
      return errorResponse(
        "Invalid API key",
        "Register at POST /api/agents/register to get an API key",
        401
      );
    }

    // Rate limit: max 10 profiles per agent
    const existingCount = await Profile.countDocuments({ agentId: agent._id });
    if (existingCount >= 10) {
      return errorResponse(
        "Profile submission limit reached",
        "You have submitted the maximum of 10 profiles. This limit exists to keep the sandbox fair.",
        429
      );
    }

    const body = await request.json();
    const {
      annualIncome,
      debtAmount,
      credentialScore,
      trajectoryScore,
      recoveryScore,
      creditNeeded,
      purpose,
    } = body;

    // Validation
    if (typeof annualIncome !== "number" || annualIncome < 0) {
      return errorResponse("annualIncome must be a non-negative number");
    }
    if (typeof debtAmount !== "number" || debtAmount < 0) {
      return errorResponse("debtAmount must be a non-negative number");
    }
    if (typeof credentialScore !== "number" || credentialScore < 0 || credentialScore > 100) {
      return errorResponse("credentialScore must be a number between 0 and 100");
    }
    if (typeof trajectoryScore !== "number" || trajectoryScore < 0 || trajectoryScore > 100) {
      return errorResponse("trajectoryScore must be a number between 0 and 100");
    }
    if (typeof recoveryScore !== "number" || recoveryScore < 0 || recoveryScore > 100) {
      return errorResponse("recoveryScore must be a number between 0 and 100");
    }
    if (typeof creditNeeded !== "number" || creditNeeded <= 0) {
      return errorResponse("creditNeeded must be a positive number");
    }
    if (!purpose || typeof purpose !== "string" || purpose.trim().length === 0) {
      return errorResponse("purpose is required");
    }

    // Calculate merit score
    const cs = clamp(credentialScore, 0, 100);
    const ts = clamp(trajectoryScore, 0, 100);
    const rs = clamp(recoveryScore, 0, 100);
    const meritScore = parseFloat((0.3 * cs + 0.4 * ts + 0.3 * rs).toFixed(2));
    const approved = meritScore >= 60;

    const notes = generateNotes(cs, ts, rs, meritScore, approved, annualIncome, debtAmount, purpose.trim());

    const profile = await Profile.create({
      agentId: agent._id,
      agentName: agent.name,
      archetypeTag: agent.archetypeTag,
      annualIncome,
      debtAmount,
      credentialScore: cs,
      trajectoryScore: ts,
      recoveryScore: rs,
      meritScore,
      creditNeeded,
      purpose: purpose.trim(),
      approved,
      notes,
    });

    // Update agent last active
    agent.lastActive = new Date();
    await agent.save();

    await logActivity(
      agent._id,
      agent.name,
      "profile_submitted",
      `Merit Score: ${meritScore} | Approved: ${approved} | Purpose: ${purpose.trim()}`
    );

    return successResponse(
      {
        profile_id: profile._id,
        meritScore: profile.meritScore,
        approved: profile.approved,
        notes: profile.notes,
        credentialScore: profile.credentialScore,
        trajectoryScore: profile.trajectoryScore,
        recoveryScore: profile.recoveryScore,
        profilesRemaining: 10 - existingCount - 1,
      },
      201
    );
  } catch (err: unknown) {
    console.error("Submit profile error:", err);
    return errorResponse("Failed to submit profile", "Check your request body and try again", 500);
  }
}
