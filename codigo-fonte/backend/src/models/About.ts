import mongoose, { Document, Schema } from 'mongoose';
import { IBlock, BlockSchema } from './blockSchema';

export interface ITeamMemberLink {
  label: string;
  url: string;
}

export interface ITeamMember {
  name: string;
  role: string;
  email?: string;
  links?: ITeamMemberLink[];
}

export interface IAbout extends Document {
  content: string;
  blocks: IBlock[];
  team: ITeamMember[];
  updatedAt: Date;
}

const TeamMemberLinkSchema = new Schema<ITeamMemberLink>(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const TeamMemberSchema = new Schema<ITeamMember>({
  name: { type: String, required: true },
  role: { type: String, required: true },
  email: { type: String },
  links: { type: [TeamMemberLinkSchema], default: [] },
});

const AboutSchema = new Schema<IAbout>(
  {
    content: { type: String, default: '' },
    blocks: { type: [BlockSchema], default: [] },
    team: [TeamMemberSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IAbout>('About', AboutSchema);
