import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { NivelPrioridade } from '@/domain/prioridade';
import { Estrela, Icone } from './Icone';

export const decimal = (v: number, casas = 1) => v.toFixed(casas).replace('.', ',');
export const pct = (v: number) => `${Math.round(v * 100)}%`;

/** Logo clicável: sempre leva à tela de abertura, com a marca e o slogan. */
export function Logo({ tamanho = 36, comNome = true }: { tamanho?: number; comNome?: boolean }) {
  return (
    <Link to="/" className="logo-link linha" style={{ gap: 10 }} aria-label="Mútua, ir para o início">
      <img src="./logo-simbolo.png" alt="" height={tamanho} style={{ height: tamanho, width: 'auto' }} />
      {comNome && (
        <span style={{ fontWeight: 800, fontSize: tamanho * 0.62, letterSpacing: '-0.01em' }}>Mútua</span>
      )}
    </Link>
  );
}

export function Avatar({ nome, foto, tamanho = 48 }: { nome: string; foto?: string; tamanho?: number }) {
  const [falhou, setFalhou] = useState(false);
  const partes = nome.split(' ');
  const iniciais = (partes[0][0] + (partes[partes.length - 1][0] ?? '')).toUpperCase();
  if (foto && !falhou) {
    return (
      <img
        className="avatar avatar-foto"
        src={foto}
        alt=""
        width={tamanho}
        height={tamanho}
        style={{ width: tamanho, height: tamanho }}
        loading="lazy"
        onError={() => setFalhou(true)}
      />
    );
  }
  return (
    <span className="avatar" style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.36 }} aria-hidden>
      {iniciais}
    </span>
  );
}

export function AnelMatch({ valor, tamanho = 64, legenda = 'afinidade' }: { valor: number; tamanho?: number; legenda?: string }) {
  const traco = Math.max(5, tamanho * 0.1);
  const raio = (tamanho - traco) / 2;
  const circ = 2 * Math.PI * raio;
  return (
    <span
      className="anel"
      style={{ width: tamanho, height: tamanho, ['--circ' as string]: circ }}
      role="img"
      aria-label={`${valor}% de ${legenda}`}
    >
      <svg width={tamanho} height={tamanho}>
        <circle className="anel-trilho" cx={tamanho / 2} cy={tamanho / 2} r={raio} fill="none" strokeWidth={traco} />
        <circle
          className="anel-valor"
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          strokeWidth={traco}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - valor / 100)}
        />
      </svg>
      <span className="anel-texto" style={{ fontSize: tamanho * 0.27 }}>
        {valor}%{tamanho >= 80 && <small>{legenda}</small>}
      </span>
    </span>
  );
}

export function SeloVerificado({ texto }: { texto: string }) {
  return (
    <span className="selo">
      <Icone nome="escudo" tamanho={15} />
      {texto}
    </span>
  );
}

export function Estrelas({ nota, tamanho = 16 }: { nota: number; tamanho?: number }) {
  return (
    <span className="estrelas" role="img" aria-label={`Nota ${decimal(nota)} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Estrela key={i} cheia={nota >= i - 0.25} tamanho={tamanho} />
      ))}
    </span>
  );
}

export function Barra({ rotulo, valor, detalhe }: { rotulo: string; valor: number; detalhe?: string }) {
  return (
    <div className="barra-linha">
      <span>{rotulo}</span>
      <span className="num">{detalhe ?? pct(valor)}</span>
      <div className="barra">
        <span style={{ width: `${Math.round(valor * 100)}%` }} />
      </div>
    </div>
  );
}

const NIVEL_TEXTO: Record<NivelPrioridade, string> = {
  alta: 'Prioridade alta',
  media: 'Prioridade média',
  conversar: 'Converse com sua médica',
  em_dia: 'Em dia',
};

export function NivelPill({ nivel }: { nivel: NivelPrioridade }) {
  return <span className={`nivel nivel-${nivel}`}>{NIVEL_TEXTO[nivel]}</span>;
}

export function Topo({
  titulo,
  voltarPara,
  aoVoltar,
  children,
}: {
  titulo?: string;
  voltarPara?: string;
  aoVoltar?: () => void;
  children?: ReactNode;
}) {
  const navegar = useNavigate();
  const voltar = () => {
    if (aoVoltar) aoVoltar();
    else if (voltarPara) navegar(voltarPara);
    else navegar(-1);
  };
  return (
    <header className="topo">
      <button type="button" className="btn-icone" aria-label="Voltar" onClick={voltar}>
        <Icone nome="voltar" />
      </button>
      <span className="topo-titulo">{titulo}</span>
      {children}
      <Logo tamanho={22} comNome={false} />
    </header>
  );
}

export function ChipOpcao({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="chip chip-opcao" aria-pressed={ativo} onClick={onClick}>
      {/* O check fica sempre no DOM e abre por largura: o chip cresce suave, sem pulo. */}
      <span className="chip-check" aria-hidden>
        <Icone nome="check" tamanho={16} />
      </span>
      {children}
    </button>
  );
}

export function Toast({ mensagem, aoFechar }: { mensagem: string | null; aoFechar: () => void }) {
  useEffect(() => {
    if (!mensagem) return;
    const t = setTimeout(aoFechar, 3200);
    return () => clearTimeout(t);
  }, [mensagem, aoFechar]);
  if (!mensagem) return null;
  return (
    <div className="toast" role="status">
      {mensagem}
    </div>
  );
}

export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return <div className="carregando">{texto}</div>;
}

/** Carrega dados assíncronos de um repositório com estado de carregamento. */
export function useCarregar<T>(carregar: () => Promise<T>, deps: unknown[]): { dados: T | null; carregando: boolean } {
  const [estado, setEstado] = useState<{ dados: T | null; carregando: boolean }>({ dados: null, carregando: true });
  useEffect(() => {
    let ativo = true;
    setEstado((e) => ({ ...e, carregando: true }));
    carregar().then((dados) => ativo && setEstado({ dados, carregando: false }));
    return () => {
      ativo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return estado;
}
