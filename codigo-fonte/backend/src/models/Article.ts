import mongoose, { Document, Schema } from 'mongoose';
import { IBlock, BlockSchema } from './blockSchema';

export type { IBlock };

export interface IArticle extends Document {
  title: string;
  slug: string;
  author: string;
  column: string;
  epigraph?: string;
  content: string;
  blocks: IBlock[];
  footnotes?: string[];
  images?: string[];
  coverImage?: string;
  published: boolean;
  order: number;
  parentType: 'revista' | 'catalogo' | 'ciclo';
  parentId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    author: { type: String, required: true },
    column: { type: String, required: true },
    epigraph: { type: String },
    content: { type: String, default: '' },
    blocks: { type: [BlockSchema], default: [] },
    footnotes: [{ type: String }],
    images: [{ type: String }],
    coverImage: { type: String },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    parentType: { type: String, enum: ['revista', 'catalogo', 'ciclo'], required: true },
    parentId: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IArticle>('Article', ArticleSchema);
