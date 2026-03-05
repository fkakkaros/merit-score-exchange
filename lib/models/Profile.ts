import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProfile extends Document {
  agentId: mongoose.Types.ObjectId;
  agentName: string;
  archetypeTag: string;
  annualIncome: number;
  debtAmount: number;
  credentialScore: number;
  trajectoryScore: number;
  recoveryScore: number;
  meritScore: number;
  creditNeeded: number;
  purpose: string;
  approved: boolean;
  notes: string;
  createdAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    agentName: { type: String, required: true },
    archetypeTag: { type: String, required: true },
    annualIncome: { type: Number, required: true, min: 0 },
    debtAmount: { type: Number, required: true, min: 0 },
    credentialScore: { type: Number, required: true, min: 0, max: 100 },
    trajectoryScore: { type: Number, required: true, min: 0, max: 100 },
    recoveryScore: { type: Number, required: true, min: 0, max: 100 },
    meritScore: { type: Number, required: true, min: 0, max: 100 },
    creditNeeded: { type: Number, required: true, min: 0 },
    purpose: { type: String, required: true, trim: true },
    approved: { type: Boolean, required: true },
    notes: { type: String, required: true },
  },
  { timestamps: true }
);

const Profile: Model<IProfile> =
  mongoose.models.Profile ?? mongoose.model<IProfile>("Profile", ProfileSchema);

export default Profile;
