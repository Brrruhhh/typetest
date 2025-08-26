import mongoose, { Document, Schema } from 'mongoose';

export interface IUserResult extends Document {
  username: string;
  wpm: number;
  accuracy: number;
  roomId: string;
  timestamp: Date;
}

const UserResultSchema: Schema = new Schema({
  username: { type: String, required: true },
  wpm: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  roomId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.models.UserResult || mongoose.model<IUserResult>('UserResult', UserResultSchema);