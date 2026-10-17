import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { descreverBanco } from '../lib/banco';

/**
 * Backup do banco indicado em MONGODB_URI: um arquivo JSON por coleção, em EJSON canônico
 * (preserva ObjectId, datas e números do jeito que estão no banco), mais um manifesto.json.
 *   npm run backup                       → backend/backups/AAAA-MM-DD-HHmm/
 *   npm run backup -- --saida <pasta>
 * A pasta backups/ fica fora do Git (dados reais do cliente). A URI nunca vai para o log:
 * em produção ela traz usuário e senha; o log mostra só host e nome do banco.
 */

const { EJSON } = mongoose.mongo.BSON;
export const PASTA_BACKUPS = path.resolve(__dirname, '../../backups');

const doisDigitos = (n: number) => String(n).padStart(2, '0');
export function pastaDoBackup(base: string, quando = new Date()): string {
  const d = quando;
  const nome = `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}-${doisDigitos(d.getHours())}${doisDigitos(d.getMinutes())}`;
  return path.join(base, nome);
}

export interface Manifesto {
  banco: string;
  feitoEm: string;
  colecoes: Record<string, number>;
}

/** Nome do banco da URI (o que vem depois da barra), ou 'test' (padrão do driver) */
export function nomeDoBanco(uri: string): string {
  return new mongoose.mongo.MongoClient(uri).options.dbName || 'test';
}

export async function fazerBackup({
  uri,
  destino,
  log = console.log,
}: {
  uri: string;
  destino: string;
  log?: (m: string) => void;
}): Promise<Manifesto> {
  const banco = nomeDoBanco(uri);
  log(`Backup de ${descreverBanco(uri, banco, 'configurado')} para ${destino}`);
  const cliente = new mongoose.mongo.MongoClient(uri, { serverSelectionTimeoutMS: 30_000 });
  await cliente.connect();
  try {
    const db = cliente.db(banco);
    fs.mkdirSync(destino, { recursive: true });
    const colecoes: Record<string, number> = {};
    const nomes = (await db.listCollections({}, { nameOnly: true }).toArray())
      .map((c) => c.name)
      .filter((n) => !n.startsWith('system.'))
      .sort();
    for (const nome of nomes) {
      const docs = await db.collection(nome).find().sort({ _id: 1 }).toArray();
      fs.writeFileSync(path.join(destino, `${nome}.json`), EJSON.stringify(docs, undefined, 1, { relaxed: false }));
      colecoes[nome] = docs.length;
      log(`  ${nome}: ${docs.length} documento(s)`);
    }
    const manifesto: Manifesto = { banco, feitoEm: new Date().toISOString(), colecoes };
    fs.writeFileSync(path.join(destino, 'manifesto.json'), JSON.stringify(manifesto, null, 2));
    log('Backup concluído.');
    return manifesto;
  } finally {
    await cliente.close();
  }
}

function argumento(nome: string, argv: string[]): string | undefined {
  const i = argv.indexOf(nome);
  return i >= 0 ? argv[i + 1] : undefined;
}

async function main() {
  dotenv.config();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Defina MONGODB_URI com o banco a copiar (por exemplo, no backend/.env ou só neste comando).');
    process.exitCode = 1;
    return;
  }
  const destino = argumento('--saida', process.argv) ?? pastaDoBackup(PASTA_BACKUPS);
  await fazerBackup({ uri, destino: path.resolve(destino) });
}

if (require.main === module) {
  main().catch((err) => {
    // a mensagem do driver pode citar o host, nunca a senha; ainda assim, sem stack com a URI
    console.error(`Falha no backup: ${(err as Error).message}`);
    process.exit(1);
  });
}
