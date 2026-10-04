'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { adminApi, ErroSessaoExpirada } from '@/lib/adminApi';
import { EVENTO_SESSAO_RENOVADA } from '@/lib/sessao';

const PREFIXO = 'xhy_rascunho:';

/**
 * Rascunho local de um formulário longo (editor de textos): grava no navegador a cada
 * alteração e oferece restaurar se a página for fechada, recarregada ou a sessão expirar.
 */
export function useRascunhoLocal<T>(chave: string, valor: T, ativo: boolean) {
  const [guardado, setGuardado] = useState<{ valor: T; em: number } | null>(null);
  const carregou = useRef(false);

  useEffect(() => {
    try {
      const bruto = localStorage.getItem(PREFIXO + chave);
      if (bruto) setGuardado(JSON.parse(bruto));
    } catch {
      /* sem armazenamento: sem rascunho */
    }
    carregou.current = true;
  }, [chave]);

  useEffect(() => {
    if (!carregou.current || !ativo) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(PREFIXO + chave, JSON.stringify({ valor, em: Date.now() }));
      } catch {
        /* cota cheia ou bloqueado: segue sem rascunho */
      }
    }, 600);
    return () => clearTimeout(t);
  }, [chave, valor, ativo]);

  const descartar = useCallback(() => {
    try {
      localStorage.removeItem(PREFIXO + chave);
    } catch {
      /* nada */
    }
    setGuardado(null);
  }, [chave]);

  return { rascunho: guardado, descartarRascunho: descartar };
}

/** Envio de imagem com estado de progresso e mensagem de erro, para capa e blocos de imagem */
export function useUploadImagem(aoEnviar: (url: string) => void) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const enviar = useCallback(
    async (arquivo: File) => {
      setErro('');
      if (arquivo.size > 10 * 1024 * 1024) {
        setErro('A imagem passa de 10 MB. Reduza o tamanho e tente de novo.');
        return;
      }
      setEnviando(true);
      try {
        const { url } = await adminApi.upload(arquivo);
        aoEnviar(url);
      } catch (e) {
        setErro(e instanceof ErroSessaoExpirada ? 'Sessão expirada: entre de novo e reenvie a imagem.' : e instanceof Error ? e.message : 'Erro no envio');
      } finally {
        setEnviando(false);
      }
    },
    [aoEnviar]
  );

  return { enviar, enviando, erro };
}

/** Compara o estado atual com o inicial para saber se há alterações não salvas */
export function useSujo<T>(atual: T) {
  const [inicial, setInicial] = useState(() => JSON.stringify(atual));
  const sujo = JSON.stringify(atual) !== inicial;
  const marcarSalvo = useCallback((valor?: T) => setInicial(JSON.stringify(valor ?? atual)), [atual]);
  return { sujo, marcarSalvo };
}

/** Carrega dados de uma página do painel com estados de carregando e erro e um "tentar de novo" */
export function useCarregar<T>(carregar: () => Promise<T>, deps: unknown[]) {
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState('');
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let ativo = true;
    setErro('');
    carregar()
      .then((d) => ativo && setDados(d))
      .catch((e) => {
        // sessão expirada é tratada pelo re-login; aqui só os outros erros
        if (ativo && !(e instanceof ErroSessaoExpirada)) setErro(e instanceof Error ? e.message : 'Erro ao carregar');
      });
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, versao]);

  // Depois do re-login, uma página que não carregou tenta de novo sozinha
  useEffect(() => {
    const aoRenovar = () => setVersao((v) => v + 1);
    window.addEventListener(EVENTO_SESSAO_RENOVADA, aoRenovar);
    return () => window.removeEventListener(EVENTO_SESSAO_RENOVADA, aoRenovar);
  }, []);

  return { dados, setDados, erro, recarregar: () => setVersao((v) => v + 1) };
}
