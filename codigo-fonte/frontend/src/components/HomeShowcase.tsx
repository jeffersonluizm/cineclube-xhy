'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { imageUrl } from '@/lib/media';
import type { Article, Catalog, Magazine } from '@/lib/types';

export interface ShowcaseSlide {
  key: string;
  type: 'revista' | 'catalogo';
  href: string;
  coverImage?: string;
  magazine?: Magazine;
  catalog?: Catalog;
  articles: Article[];
}

interface HomeShowcaseProps {
  slides: ShowcaseSlide[];
}

const TRANSITION_MS = 750;

const nomeDoSlide = (s: ShowcaseSlide) => (s.type === 'revista' ? `Revista XHY n°${s.magazine?.number}` : `catálogo ${s.catalog?.title}`);

/**
 * "Prateleira" de edições da página inicial: rolar, deslizar ou usar as setas troca a edição.
 * Acessível: as edições escondidas ficam inertes (fora do Tab e do leitor de tela), a troca é
 * anunciada, as setas do teclado só agem com o foco na prateleira e, na última edição, a
 * rolagem volta a descer a página até o rodapé.
 */
export default function HomeShowcase({ slides }: HomeShowcaseProps) {
  const [index, setIndex] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lockRef = useRef(false);
  const wheelAccum = useRef(0);
  const touchStartY = useRef<number | null>(null);
  const indexRef = useRef(0);
  const total = slides.length;

  indexRef.current = index;

  const irPara = useCallback(
    (alvo: number) => {
      if (lockRef.current) return;
      const next = Math.min(Math.max(alvo, 0), total - 1);
      if (next === indexRef.current) return;
      lockRef.current = true;
      setTimeout(() => {
        lockRef.current = false;
      }, TRANSITION_MS + 100);
      setIndex(next);
    },
    [total]
  );

  // Edições fora de vista ficam inertes: nem Tab nem leitor de tela chegam aos links delas
  useEffect(() => {
    slideRefs.current.forEach((el, j) => {
      if (el) (el as HTMLElement & { inert: boolean }).inert = j !== index;
    });
  }, [index]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const naBorda = (dir: 1 | -1) => (dir === 1 && indexRef.current === total - 1) || (dir === -1 && indexRef.current === 0);

    const onWheel = (e: WheelEvent) => {
      const dir = e.deltaY > 0 ? 1 : -1;
      // Na última edição, rolar para baixo desce a página até o rodapé (e na primeira, para cima)
      if (naBorda(dir)) return;
      e.preventDefault();
      if (lockRef.current) return;
      wheelAccum.current += e.deltaY;
      if (Math.abs(wheelAccum.current) > 60) {
        wheelAccum.current = 0;
        irPara(indexRef.current + dir);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY.current == null || e.touches.length > 1) return; // pinça para zoom passa direto
      const delta = touchStartY.current - (e.touches[0]?.clientY ?? touchStartY.current);
      if (Math.abs(delta) > 55) {
        const dir = delta > 0 ? 1 : -1;
        touchStartY.current = null;
        if (naBorda(dir)) {
          if (dir === 1) window.scrollBy({ top: window.innerHeight * 0.6, behavior: 'smooth' });
          return;
        }
        irPara(indexRef.current + dir);
      }
      e.preventDefault();
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    stage.addEventListener('touchstart', onTouchStart, { passive: true });
    stage.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      stage.removeEventListener('wheel', onWheel);
      stage.removeEventListener('touchstart', onTouchStart);
      stage.removeEventListener('touchmove', onTouchMove);
    };
  }, [irPara, total]);

  function onKeyDown(e: React.KeyboardEvent) {
    const teclas: Record<string, number> = {
      ArrowDown: index + 1,
      PageDown: index + 1,
      ArrowUp: index - 1,
      PageUp: index - 1,
      Home: 0,
      End: total - 1,
    };
    if (!(e.key in teclas)) return;
    e.preventDefault();
    irPara(teclas[e.key]);
  }

  if (total === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
        <p className="font-display font-black text-text-dark text-titulo-lista mb-3">em breve</p>
        <p className="font-serif italic text-text-dark max-w-sm">
          A primeira edição está sendo montada. Enquanto isso, veja{' '}
          <Link href="/ciclos-mostras" className="text-azul-escuro underline">
            as exibições
          </Link>{' '}
          ou{' '}
          <Link href="/sobre" className="text-azul-escuro underline">
            quem somos
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <section
      ref={stageRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="flex-1 relative overflow-hidden select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-escuro"
      style={{ touchAction: 'pinch-zoom' }}
      aria-roledescription="carrossel"
      aria-label="edições do cineclube"
      aria-describedby="instrucoes-prateleira"
    >
      <p id="instrucoes-prateleira" className="sr-only">
        Use as setas para cima e para baixo para trocar de edição, ou os botões ao lado.
      </p>
      <p className="sr-only" aria-live="polite">
        {nomeDoSlide(slides[index])}, {index + 1} de {total}
      </p>

      {slides.map((slide, j) => {
        const pos = j - index;
        // pos < 0: já foi "retirada da prateleira"; pos === 0: em exibição; pos > 0: aguardando atrás
        const style: React.CSSProperties = {
          transition: `transform ${TRANSITION_MS}ms cubic-bezier(.22,.9,.28,1), opacity ${TRANSITION_MS}ms ease`,
          zIndex: pos < 0 ? 40 : pos === 0 ? 30 : 20 - pos,
          transform:
            pos < 0
              ? 'translateY(-115%) rotate(-7deg) scale(1.04)'
              : pos === 0
                ? 'none'
                : `translateY(${2.2 * pos}%) scale(${1 - 0.05 * pos})`,
          opacity: pos < 0 ? 0 : pos === 0 ? 1 : pos === 1 ? 0.16 : 0,
          pointerEvents: pos === 0 ? 'auto' : 'none',
        };

        return (
          <div
            key={slide.key}
            ref={(el) => {
              slideRefs.current[j] = el;
            }}
            className="absolute inset-0 flex items-center justify-center px-5 sm:px-8 pt-8 pb-10 sm:py-0"
            style={style}
            role="group"
            aria-roledescription="edição"
            aria-label={`${nomeDoSlide(slide)} (${j + 1} de ${total})`}
          >
            {/* A edição que espera atrás mostra só a capa, como uma silhueta na prateleira */}
            <SlideContent slide={slide} hideInfo={pos !== 0} eager={j === 0} />
          </div>
        );
      })}

      <p className="absolute top-3 sm:top-6 left-5 sm:left-8 text-pink-escuro font-serif italic text-xs sm:text-sm z-40" aria-hidden="true">
        {index === 0 ? 'últimas atualizações' : 'edições anteriores'}
      </p>

      {/* Navegação lateral */}
      {total > 1 && (
        <div className="absolute right-1 sm:right-5 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 z-40">
          <button
            type="button"
            onClick={() => irPara(index - 1)}
            disabled={index === 0}
            aria-label="edição mais recente"
            className="font-display text-text-dark hover:text-olive-escuro disabled:opacity-30 text-lg p-2"
          >
            ▲
          </button>
          {slides.map((slide, j) => (
            <button
              key={slide.key}
              type="button"
              onClick={() => irPara(j)}
              aria-label={nomeDoSlide(slide)}
              aria-current={j === index ? 'true' : undefined}
              className="p-1.5 group"
            >
              <span
                className={`block w-2.5 h-2.5 rounded-full border transition-colors ${
                  j === index ? 'bg-pink-escuro border-pink-escuro' : 'border-text-dark group-hover:bg-olive-escuro'
                }`}
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => irPara(index + 1)}
            disabled={index === total - 1}
            aria-label="edição anterior"
            className="font-display text-text-dark hover:text-olive-escuro disabled:opacity-30 text-lg p-2"
          >
            ▼
          </button>
        </div>
      )}

      <p className="absolute bottom-3 sm:bottom-5 inset-x-0 text-center font-serif italic text-text-suave text-xs sm:text-sm z-40">
        {index < total - 1 ? (
          <span aria-hidden="true">
            <span className="sm:hidden">deslize para ver a próxima edição</span>
            <span className="hidden sm:inline">role para ver a próxima edição</span>
          </span>
        ) : (
          <Link href="/revista" className="underline pointer-events-auto">
            ver todas as edições
          </Link>
        )}
      </p>
    </section>
  );
}

function SlideContent({ slide, hideInfo, eager }: { slide: ShowcaseSlide; hideInfo?: boolean; eager?: boolean }) {
  const mag = slide.magazine;
  const cat = slide.catalog;

  return (
    <div className="flex flex-col sm:flex-row gap-5 sm:gap-12 items-center justify-center max-w-5xl w-full">
      <Link
        href={slide.href}
        className="w-[min(440px,42vw)] sm:w-[min(440px,40vw)] shrink-0 block group"
        aria-label={`abrir ${nomeDoSlide(slide)}`}
      >
        {slide.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl(slide.coverImage)}
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            className="w-full aspect-[3/4] object-cover shadow-[0_18px_40px_rgba(38,24,64,0.35)] group-hover:opacity-95 transition-opacity"
          />
        ) : (
          <div className="w-full aspect-[3/4] bg-dark-purple shadow-[0_18px_40px_rgba(38,24,64,0.35)]" />
        )}
      </Link>

      <div className="max-w-sm text-center sm:text-left transition-opacity duration-500" style={{ opacity: hideInfo ? 0 : 1 }}>
        {mag && (
          <>
            <Link
              href={slide.href}
              className="font-display font-black text-text-dark hover:text-olive-escuro transition-colors block mb-2 sm:mb-4 text-titulo-edicao"
            >
              n<sup className="font-black align-super text-[0.55em]">o</sup>
              {mag.number}
            </Link>

            {slide.articles.length > 0 && (
              <div className="mb-4 hidden sm:block">
                <p className="font-display font-bold text-text-dark text-base">{slide.articles[0]?.column}</p>
                <ul>
                  {slide.articles.map((a) => (
                    <li key={a._id} className="mb-1">
                      <Link
                        href={`/revista/${mag.number}/artigo/${a.slug}`}
                        className="font-serif italic text-text-dark text-sm hover:text-olive-escuro hover:underline block"
                      >
                        {a.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="font-serif text-text-dark text-sm sm:mt-6">
              Revista XHY, v. {mag.volume}, n. {mag.number},<br />
              {mag.month}, {mag.year}.
            </p>
          </>
        )}

        {cat && (
          <>
            <Link
              href={slide.href}
              className="font-display font-black text-text-dark hover:text-olive-escuro transition-colors block mb-2 sm:mb-4 text-titulo-lista"
            >
              {cat.title}
            </Link>
            <p className="font-serif text-text-dark text-sm sm:mt-6">{cat.year}</p>
          </>
        )}
      </div>
    </div>
  );
}
