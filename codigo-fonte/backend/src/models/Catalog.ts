import mongoose, { Document, Schema } from 'mongoose';

export interface ICatalog extends Document {
  title: string;
  slug: string;
  year: number;
  coverImage?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CatalogSchema = new Schema<ICatalog>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    year: { type: Number, required: true },
    coverImage: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ICatalog>('Catalog', CatalogSchema);
