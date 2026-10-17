import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { descreverBanco } from '../lib/banco';
import { nomeDoBanco, type Manifesto } from './backup';

/**
 * Restaura no banco de MONGODB_URI um backup feito por `npm run backup`.
 *   npm run restaurar -- <pasta-do-backup>
 *   npm run restaurar -- <pasta-do-backup> --substituir   (banco com conteúdo: apaga e repõe)
 * Sem --substituir, recusa um banco que já tenha documentos: restaurar por cima apagaria o
 * que a equipe publicou depois do backup. A URI nunca vai para o log.
 */

const { EJSON } = mongoose.mongo.BSON;

export async function restaurarBackup({
  uri,
  origem,
  substituir = false,
  log = console.log,
}: {
  uri: string;
  origem: string;
  substituir?: boolean;
  log?: (m: string) => void;
}): Promise<Record<string, number>> {
  const arquivoManifesto = path.join(origem, 'manifesto.json');
  if (!fs.existsSync(arquivoManifesto)) {
    throw new Error(`${origem} não parece um backup: falta o manifesto.json (gere com npm run backup).`);
  }
  const manifesto = JSON.parse(fs.readFileSync(arquivoManifesto, 'utf8')) as Manifesto;
  const banco = nomeDoBanco(uri);
  log(`Restaurando o backup de ${manifesto.feitoEm} (banco ${manifesto.banco}) em ${descreverBanco(uri, banco, 'configurado')}`);

  const cliente = new mongoose.mongo.MongoClient(uri, { serverSelectionTimeoutMS: 30_000 });
  await cliente.connect();
  try {
    const db = cliente.db(banco);
    const existentes = (await db.listCollections({}, { nameOnly: true }).toArray())
      .map((c) => c.name)
      .filter((n) => !n.startsWith('system.'));
    let documentos = 0;
    for (const nome of existentes) documentos += await db.collection(nome).countDocuments();
    if (documentos > 0 && !substituir) {
      throw new Error(
        `O banco ${banco} já tem conteúdo (${documentos} documento(s)). Restaurar por cima apagaria o que foi publicado depois do backup. ` +
          'Se é isso mesmo, rode de novo com --substituir.'
      );
    }

    const restaurados: Record<string, number> = {};
    for (const nome of Object.keys(manifesto.colecoes)) {
      const docs = EJSON.parse(fs.readFileSync(path.join(origem, `${nome}.json`), 'utf8'), { relaxed: false }) as mongoose.mongo.Document[];
      const colecao = db.collection(nome);
      if (substituir) await colecao.deleteMany({});
      if (docs.length) await colecao.insertMany(docs, { ordered: true });
      restaurados[nome] = docs.length;
      log(`  ${nome}: ${docs.length} documento(s)`);
    }
    log('Restauração concluída. Os índices são recriados pela API na próxima partida.');
    return restaurados;
  } finally {
    await cliente.close();
  }
}

async function main() {
  dotenv.config();
  const uri = process.env.MONGODB_URI;
  const origem = process.argv.slice(2).find((a) => !a.startsWith('--'));
  if (!uri || !origem) {
    console.error('Uso: MONGODB_URI=<banco de destino> npm run restaurar -- <pasta-do-backup> [--substituir]');
    process.exitCode = 1;
    return;
  }
  await restaurarBackup({ uri, origem: path.resolve(origem), substituir: process.argv.includes('--substituir') });
}

if (require.main === module) {
  main().catch((err) => {
    console.error(`Falha na restauração: ${(err as Error).message}`);
    process.exit(1);
  });
}
