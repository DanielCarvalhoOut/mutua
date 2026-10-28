// Tour guiado: destaca um elemento por vez (marcado com data-tour="<alvo>") e explica
// num balão. Passos cujo alvo não está na tela são pulados.

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface PassoTour {
  alvo: string;
  titulo: string;
  texto: string;
}

interface Retangulo {
  top: number;
  left: number;
  width: number;
  height: number;
}

const FOLGA = 8; // respiro do destaque em volta do elemento
const LARGURA_BALAO = 320;

export function Tour({ passos, aoTerminar }: { passos: PassoTour[]; aoTerminar: () => void }) {
  // Os alvos são procurados depois que a tela foi desenhada, não durante a renderização.
  const [visiveis, setVisiveis] = useState<PassoTour[] | null>(null);
  useLayoutEffect(() => {
    setVisiveis(passos.filter((p) => document.querySelector(`[data-tour="${p.alvo}"]`)));
  }, [passos]);
  const [i, setI] = useState(0);
  const [ret, setRet] = useState<Retangulo | null>(null);
  const balao = useRef<HTMLDivElement>(null);
  const passo = visiveis?.[i];

  const medir = useCallback(() => {
    const el = passo && document.querySelector<HTMLElement>(`[data-tour="${passo.alvo}"]`);
    if (!el) return setRet(null);
    const r = el.getBoundingClientRect();
    setRet({ top: r.top - FOLGA, left: r.left - FOLGA, width: r.width + FOLGA * 2, height: r.height + FOLGA * 2 });
  }, [passo]);

  // Ao mudar de passo, leva o alvo ao centro da tela e mede depois da rolagem.
  useLayoutEffect(() => {
    const el = passo && document.querySelector<HTMLElement>(`[data-tour="${passo.alvo}"]`);
    if (!el) return;
    const reduzir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: 'center', behavior: reduzir ? 'auto' : 'smooth' });
    medir();
    const t = setTimeout(medir, 380);
    return () => clearTimeout(t);
  }, [passo, medir]);

  useEffect(() => {
    let quadro = 0;
    const agendar = () => {
      cancelAnimationFrame(quadro);
      quadro = requestAnimationFrame(medir);
    };
    window.addEventListener('scroll', agendar, true);
    window.addEventListener('resize', agendar);
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && aoTerminar();
    window.addEventListener('keydown', tecla);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener('scroll', agendar, true);
      window.removeEventListener('resize', agendar);
      window.removeEventListener('keydown', tecla);
    };
  }, [medir, aoTerminar]);

  useEffect(() => {
    balao.current?.focus();
  }, [i]);

  useEffect(() => {
    if (visiveis && !visiveis.length) aoTerminar();
  }, [visiveis, aoTerminar]);

  if (!visiveis || !passo) return null;

  const ultimo = i === visiveis.length - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const largura = Math.min(LARGURA_BALAO, vw - 32);
  // Balão abaixo do destaque quando ele está na metade de cima da tela; acima, caso contrário.
  const abaixo = !ret || ret.top + ret.height / 2 < vh / 2;
  const centroX = ret ? ret.left + ret.width / 2 : vw / 2;
  const left = Math.max(16, Math.min(vw - largura - 16, centroX - largura / 2));
  const setaX = Math.max(20, Math.min(largura - 20, centroX - left));
  const estiloBalao: React.CSSProperties = ret
    ? abaixo
      ? { top: Math.min(ret.top + ret.height + 14, vh - 200), left, width: largura }
      : { bottom: Math.max(vh - ret.top + 14, 16), left, width: largura }
    : { top: vh / 2 - 100, left, width: largura };

  return (
    <div className="tour" aria-live="polite">
      {/* Bloqueia toques na tela enquanto o tour está aberto. */}
      <div className="tour-bloqueio" onClick={(e) => e.stopPropagation()} />
      {ret && <div className="tour-destaque" style={ret} />}
      <div
        ref={balao}
        className="tour-balao"
        data-lado={abaixo ? 'abaixo' : 'acima'}
        style={{ ...estiloBalao, ['--seta-x' as string]: `${setaX}px` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-titulo"
        tabIndex={-1}
        key={i}
      >
        <span className="tour-contador num">
          {i + 1} de {visiveis.length}
        </span>
        <strong id="tour-titulo">{passo.titulo}</strong>
        <p>{passo.texto}</p>
        <div className="tour-acoes">
          <button type="button" className="btn btn-texto" onClick={aoTerminar}>
            Pular
          </button>
          <span style={{ flex: 1 }} />
          {i > 0 && (
            <button type="button" className="btn btn-secundario tour-btn" onClick={() => setI(i - 1)}>
              Voltar
            </button>
          )}
          <button
            type="button"
            className="btn btn-primario tour-btn"
            onClick={() => (ultimo ? aoTerminar() : setI(i + 1))}
          >
            {ultimo ? 'Entendi' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}
