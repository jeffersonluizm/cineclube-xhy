import mongoose, { Document, Schema } from 'mongoose';

export interface IScreening {
  date: string;
  time: string;
  filmTitle: string;
  filmSlug: string;
  director: string;
  duration: string;
  country: string;
}

export interface ICycle extends Document {
  title: string;
  subtitle?: string;
  slug: string;
  year: number;
  coverImage?: string;
  description?: string;
  author?: string;
  authorFootnote?: string;
  epigraph?: string;
  footnotes?: string[];
  screenings: IScreening[];
  createdAt: Date;
  updatedAt: Date;
}

const ScreeningSchema = new Schema<IScreening>({
  date: { type: String, required: true },
  time: { type: String, required: true },
  filmTitle: { type: String, required: true },
  filmSlug: { type: String, required: true },
  director: { type: String, required: true },
  duration: { type: String, required: true },
  country: { type: String, required: true },
});

const CycleSchema = new Schema<ICycle>(
  {
    title: { type: String, required: true },
    subtitle: { type: String },
    slug: { type: String, required: true, unique: true },
    year: { type: Number, required: true },
    coverImage: { type: String },
    description: { type: String },
    author: { type: String },
    authorFootnote: { type: String },
    epigraph: { type: String },
    footnotes: [{ type: String }],
    screenings: [ScreeningSchema],
  },
  { timestamps: true }
);

export default mongoose.model<ICycle>('Cycle', CycleSchema);
