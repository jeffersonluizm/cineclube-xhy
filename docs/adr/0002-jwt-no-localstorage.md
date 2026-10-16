# ADR 0002: token JWT de 8 horas no localStorage, com CSP

- **Status:** aceita (1.1.0), revista em 1.3.0
- **Data:** 04/10/2026

## Contexto

O site (Vercel) e a API (Render) ficam em domínios diferentes no plano gratuito. Um cookie
de sessão entre domínios exigiria `SameSite=None`, proteção CSRF e configuração de
domínio próprio comum aos dois; sem domínio próprio, nem é possível.

## Decisão

A API emite um JWT HS256 assinado com `JWT_SECRET`, válido por **8 horas** (era 7 dias), com
o papel `editor` e a versão da senha. O painel guarda o token no `localStorage` e o envia
no cabeçalho `Authorization`. Como o token não vai em cookie, não há CSRF. Mitigações do
risco de XSS: React escapa o conteúdo, links do editor só aceitam `https:`/`mailto:`, o
site manda `Content-Security-Policy` (scripts só do próprio site) e o upload confere o
tipo da imagem pelos bytes. O segredo de desenvolvimento só é aceito com banco local.

A expiração é tratada como parte da experiência: aviso 10 minutos antes, re-login por cima
da página sem perder o formulário e rascunho local dos textos (apagado ao sair).

## Consequências

- Funciona sem domínio comum e sem estado no servidor.
- Um XSS bem-sucedido conseguiria ler o token: a CSP reduz, não elimina (o Next ainda
  exige `'unsafe-inline'` para scripts sem nonce, e nonce desligaria o cache das páginas).
- Não há revogação individual; trocar a senha (ADR 0001) derruba todos os tokens.
- Caminho de evolução: com domínio próprio, um proxy `/api` no mesmo domínio e cookie
  `httpOnly; Secure; SameSite=Strict`.
