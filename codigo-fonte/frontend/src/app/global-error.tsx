'use client';

import { cores } from '@/lib/tokens';

/**
 * Último recurso: erro no próprio layout raiz. Substitui o <html> inteiro, então não usa
 * as fontes nem o CSS do site; as cores vêm dos tokens em estilo direto.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: cores['dark-purple'], color: cores.cream, fontFamily: 'Georgia, serif' }}>
        <main role="alert" style={{ maxWidth: 560, padding: '15vh 24px' }}>
          <p style={{ color: cores['pink-claro'], fontStyle: 'italic' }}>serviço indisponível</p>
          <h1 style={{ fontSize: 'clamp(2.5rem, 9vw, 4.5rem)', lineHeight: 1, margin: '0 0 24px', fontFamily: 'system-ui, sans-serif' }}>
            projetor com defeito
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6 }}>O site não conseguiu abrir. Tente de novo em instantes.</p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              background: 'none',
              border: 0,
              color: cores.olive,
              font: 'bold 16px system-ui, sans-serif',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
