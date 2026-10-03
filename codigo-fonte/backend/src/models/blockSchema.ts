import { Schema } from 'mongoose';

export interface IBlock {
  type: 'paragraph' | 'subtitle' | 'quote' | 'image';
  text?: string;
  src?: string;
  caption?: string;
  align?: 'full' | 'left' | 'right' | 'center';
  width?: 'small' | 'medium' | 'large';
}

export const BlockSchema = new Schema<IBlock>(
  {
    type: { type: String, enum: ['paragraph', 'subtitle', 'quote', 'image'], required: true },
    text: { type: String },
    src: { type: String },
    caption: { type: String },
    align: { type: String, enum: ['full', 'left', 'right', 'center'], default: 'full' },
    width: { type: String, enum: ['small', 'medium', 'large'], default: 'large' },
  },
  { _id: false }
);
