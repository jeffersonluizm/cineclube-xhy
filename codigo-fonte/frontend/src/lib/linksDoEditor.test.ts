// Links que o editor cadastra (equipe no Sobre): só https/mailto, e externos sem repassar reputação
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atributosDoLinkDoEditor, linkDoEditorSeguro } from './linksDoEditor';

test('aceita só https e mailto', () => {
  assert.equal(linkDoEditorSeguro('https://exemplo.com'), true);
  assert.equal(linkDoEditorSeguro('mailto:a@b.c'), true);
  assert.equal(linkDoEditorSeguro('javascript:alert(1)'), false);
  assert.equal(linkDoEditorSeguro('http://exemplo.com'), false);
});

test('link externo abre em outra aba com rel="noopener noreferrer nofollow"; mailto não', () => {
  assert.deepEqual(atributosDoLinkDoEditor('https://exemplo.com'), { target: '_blank', rel: 'noopener noreferrer nofollow' });
  assert.deepEqual(atributosDoLinkDoEditor('mailto:a@b.c'), {});
});
