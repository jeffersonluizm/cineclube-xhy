import mongoose, { Document, Schema } from 'mongoose';

export interface IFilm extends Document {
  title: string;
  slug: string;
  director: string;
  year: number;
  duration: string;
  country: string;
  image?: string;
  synopsis: string;
  content?: string;
  author?: string;
  authorFootnote?: string;
  epigraph?: string;
  footnotes?: string[];
  cycleId: mongoose.Types.ObjectId;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const FilmSchema = new Schema<IFilm>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    director: { type: String, required: true },
    year: { type: Number, required: true },
    duration: { type: String, required: true },
    country: { type: String, required: true },
    image: { type: String },
    synopsis: { type: String, required: true },
    content: { type: String },
    author: { type: String },
    authorFootnote: { type: String },
    epigraph: { type: String },
    footnotes: [{ type: String }],
    cycleId: { type: Schema.Types.ObjectId, ref: 'Cycle', required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

FilmSchema.index({ cycleId: 1, order: 1 });

FilmSchema.index(
  { title: 'text', director: 'text', synopsis: 'text' },
  { name: 'busca_filmes', default_language: 'portuguese', weights: { title: 5, director: 3, synopsis: 1 } }
);

export default mongoose.model<IFilm>('Film', FilmSchema);
