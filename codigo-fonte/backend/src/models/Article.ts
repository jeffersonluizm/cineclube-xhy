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

// Leituras do site e do painel: textos de um pai, publicados, na ordem
ArticleSchema.index({ parentType: 1, parentId: 1, published: 1, order: 1 });
ArticleSchema.index({ published: 1, createdAt: -1 });

// Busca do site: título pesa mais que autor, que pesa mais que o corpo; sem acentos (índice de texto v3)
ArticleSchema.index(
  { title: 'text', author: 'text', content: 'text' },
  { name: 'busca_textos', default_language: 'portuguese', weights: { title: 5, author: 3, content: 1 } }
);

export default mongoose.model<IArticle>('Article', ArticleSchema);
