import mongoose, { Schema, Document, Model } from "mongoose";

export interface IActivityLog extends Document {
  agentId: mongoose.Types.ObjectId;
  agentName: string;
  action: string;
  details: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true, index: true },
    agentName: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String, required: true },
  },
  { timestamps: true }
);

const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ??
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);

export default ActivityLog;
