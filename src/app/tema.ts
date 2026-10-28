// Tema da interface: automático (segue o celular/computador), claro ou escuro.
// Os tokens de cor já reagem a `data-theme` no <html> (shared/estilos/tokens.css).

import { useCallback, useState } from 'react';
import { gravarJson, lerJson } from '@/adapters/storage';

export type Tema = 'sistema' | 'claro' | 'escuro';

const CHAVE = 'mutua:tema:v1';
const COR_BARRA = { claro: '#F9F4F7', escuro: '#1B1218' } as const;
const escuroNoSistema = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;

export function lerTema(): Tema {
  const t = lerJson<Tema>(CHAVE, 'sistema');
  return t === 'claro' || t === 'escuro' ? t : 'sistema';
}

/** Aplica o tema no documento, inclusive a cor da barra do navegador no celular. */
export function aplicarTema(tema: Tema): void {
  const raiz = document.documentElement;
  if (tema === 'sistema') raiz.removeAttribute('data-theme');
  else raiz.setAttribute('data-theme', tema === 'escuro' ? 'dark' : 'light');

  const escuro = tema === 'escuro' || (tema === 'sistema' && escuroNoSistema());
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', escuro ? COR_BARRA.escuro : COR_BARRA.claro);
}

/** Mantém a barra do navegador certa quando o sistema troca de tema sozinho (ex.: ao anoitecer). */
export function acompanharSistema(): void {
  window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
    if (lerTema() === 'sistema') aplicarTema('sistema');
  });
}

type DocumentoComTransicao = Document & { startViewTransition?: (atualizar: () => void) => unknown };

export function useTema(): [Tema, (t: Tema) => void] {
  const [tema, setTema] = useState<Tema>(lerTema);

  const escolher = useCallback((novo: Tema) => {
    const trocar = () => {
      aplicarTema(novo);
      gravarJson(CHAVE, novo);
      setTema(novo);
    };
    // Esmaecimento suave entre os temas onde o navegador suporta; nos demais, troca direta.
    const doc = document as DocumentoComTransicao;
    const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (doc.startViewTransition && !reduzir) doc.startViewTransition(trocar);
    else trocar();
  }, []);

  return [tema, escolher];
}
