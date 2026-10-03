import mongoose, { Document, Schema } from 'mongoose';

export interface IMagazine extends Document {
  number: number;
  volume: number;
  month: string;
  year: number;
  coverImage?: string;
  editorial?: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const MagazineSchema = new Schema<IMagazine>(
  {
    number: { type: Number, required: true, unique: true },
    volume: { type: Number, required: true },
    month: { type: String, required: true },
    year: { type: Number, required: true },
    coverImage: { type: String },
    editorial: { type: String },
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMagazine>('Magazine', MagazineSchema);
