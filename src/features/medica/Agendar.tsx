import { useMemo, useState } from 'react';
import type { Medica } from '@/domain/types';
import { ChipOpcao } from '@/shared/ui/componentes';

/** Agenda de demonstração. Na versão integrada, os horários vêm de `AgendaParceira` (integrations/fontes.ts). */
export function Agendar({
  medica,
  aoFechar,
  aoConfirmar,
}: {
  medica: Medica;
  aoFechar: () => void;
  aoConfirmar: (horario: string) => void;
}) {
  const horarios = useMemo(() => {
    const base = new Date();
    return [2, 3, 6].map((dias, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + dias);
      d.setHours([9, 14, 10][i], i === 1 ? 30 : 0, 0, 0);
      return d.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    });
  }, []);
  const [escolhido, setEscolhido] = useState<string | null>(null);

  return (
    <div className="fundo-modal" onClick={aoFechar}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="agendar-titulo" onClick={(e) => e.stopPropagation()}>
        <h2 id="agendar-titulo" className="secao-titulo">
          Agendar com Dra. {medica.nome.split(' ')[0]}
        </h2>
        <p className="texto-sec">Horários livres nesta semana. Você pode levar acompanhante, é seu direito (Lei 14.737/2023).</p>
        <div className="linha-wrap">
          {horarios.map((h) => (
            <ChipOpcao key={h} ativo={escolhido === h} onClick={() => setEscolhido(h)}>
              {h}
            </ChipOpcao>
          ))}
        </div>
        <div className="linha" style={{ gap: 10 }}>
          <button type="button" className="btn btn-secundario" style={{ flex: 1 }} onClick={aoFechar}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primario"
            style={{ flex: 1 }}
            disabled={!escolhido}
            onClick={() => escolhido && aoConfirmar(escolhido)}
          >
            Confirmar
          </button>
        </div>
        <p className="faixa-demo" style={{ padding: 0 }}>
          Demonstração: o pedido não é enviado a um consultório real.
        </p>
      </div>
    </div>
  );
}
