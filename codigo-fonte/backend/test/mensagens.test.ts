// Mensagens de erro da API em português, sem nome de campo em inglês
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { z } from 'zod';
import app from '../src/app';
import { signToken } from '../src/middleware/auth';
import { mensagemDeValidacao, tratadorDeErros, ROTULOS } from '../src/middleware/erros';
import { abrirBancoEmMemoria } from './helpers/bancoEmMemoria';

let banco: Awaited<ReturnType<typeof abrirBancoEmMemoria>>;
before(async () => {
  banco = await abrirBancoEmMemoria();
});
after(async () => {
  await banco?.fechar();
});
beforeEach(async () => {
  await banco.limpar();
});

const INGLES = /\b(filmTitle|screenings|parentId|cycleId|coverImage|title|slug|Path|required|expected|received|Invalid)\b/;

test('validação genérica cita o campo em português, também dentro de listas', () => {
  const esquema = z.object({ screenings: z.array(z.object({ filmTitle: z.string() })) });
  const r = esquema.safeParse({ screenings: [{ filmTitle: 1 }] });
  assert.equal(r.success, false);
  const msg = mensagemDeValidacao(r.error!);
  assert.match(msg, /^programação #1 título do filme: /);
  assert.doesNotMatch(msg, INGLES);
});

test('todo campo dos esquemas do painel tem rótulo em português', async () => {
  const fs = await import('node:fs');
  const fonte = fs.readFileSync(new URL('../src/validacao/esquemas.ts', import.meta.url), 'utf8');
  const campos = new Set(Array.from(fonte.matchAll(/^\s+([a-zA-Z]+):/gm), (m) => m[1]));
  const semRotulo = [...campos].filter((c) => !(c in ROTULOS));
  assert.deepEqual(semRotulo, []);
});

test('campo desconhecido não vaza o nome técnico', () => {
  const r = z.object({ xyzInterno: z.string() }).safeParse({ xyzInterno: 2 });
  const msg = mensagemDeValidacao(r.error!);
  assert.doesNotMatch(msg, /xyzInterno/);
  assert.match(msg, /^campo: /);
});

function responder(err: unknown) {
  let status = 0;
  let corpo: { error?: string } = {};
  const res = {
    status(s: number) {
      status = s;
      return this;
    },
    json(c: { error?: string }) {
      corpo = c;
      return this;
    },
    setHeader() {},
  };
  tratadorDeErros(err, {} as never, res as never, () => {});
  return { status, error: corpo.error ?? '' };
}

test('erro de validação do Mongoose sai em português', () => {
  const Modelo =
    mongoose.models.TesteMensagem ?? mongoose.model('TesteMensagem', new mongoose.Schema({ title: { type: String, required: true } }));
  const err = new Modelo({}).validateSync()!;
  const r = responder(err);
  assert.equal(r.status, 400);
  assert.equal(r.error, 'título: campo obrigatório');
});

test('id malformado sai como "identificador inválido", sem o nome do campo técnico', () => {
  const err = new mongoose.Error.CastError('ObjectId', 'abc', '_id');
  const r = responder(err);
  assert.equal(r.status, 400);
  assert.equal(r.error, 'Identificador inválido');
});

test('busca com q repetido explica o problema certo', async () => {
  const res = await request(app).get('/api/busca?q=tempo&q=fantasma');
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Envie um só termo de busca');
  const vazio = await request(app).get('/api/busca');
  assert.equal(vazio.body.error, 'Digite o que procura');
});

test('criar texto num destino que não existe responde 404 em vez de gravar texto órfão', async () => {
  const res = await request(app)
    .post('/api/admin/artigos')
    .set('Authorization', `Bearer ${signToken()}`)
    .send({
      title: 'Órfão',
      author: 'Alguém',
      column: 'ensaio',
      blocks: [{ type: 'paragraph', text: 'oi' }],
      parentType: 'revista',
      parentId: new mongoose.Types.ObjectId().toString(),
    });
  assert.equal(res.status, 404);
  assert.match(res.body.error, /revista/i);
  assert.equal(await mongoose.connection.db!.collection('articles').countDocuments(), 0);
});
