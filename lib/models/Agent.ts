import mongoose, { Schema, Document, Model } from "mongoose";

export type ArchetypeTag =
  | "founder"
  | "international_student"
  | "option_exerciser"
  | "bootcamp_grad"
  | "freelancer"
  | "mba_student";

export type ClaimStatus = "pending_claim" | "claimed";

export interface IAgent extends Document {
  name: string;
  description: string;
  apiKey: string;
  claimToken: string;
  claimStatus: ClaimStatus;
  ownerEmail?: string;
  lastActive: Date;
  archetypeTag: ArchetypeTag;
  createdAt: Date;
}

const AgentSchema = new Schema<IAgent>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    apiKey: { type: String, required: true, unique: true, index: true },
    claimToken: { type: String, required: true, unique: true, index: true },
    claimStatus: {
      type: String,
      enum: ["pending_claim", "claimed"],
      default: "pending_claim",
    },
    ownerEmail: { type: String, trim: true },
    lastActive: { type: Date, default: Date.now },
    archetypeTag: {
      type: String,
      enum: [
        "founder",
        "international_student",
        "option_exerciser",
        "bootcamp_grad",
        "freelancer",
        "mba_student",
      ],
      required: true,
    },
  },
  { timestamps: true }
);

const Agent: Model<IAgent> =
  mongoose.models.Agent ?? mongoose.model<IAgent>("Agent", AgentSchema);

export default Agent;
