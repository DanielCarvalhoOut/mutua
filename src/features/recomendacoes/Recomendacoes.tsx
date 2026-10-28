import { useMemo } from 'react';
import { usePerfil } from '@/app/perfil';
import { useServicos } from '@/app/servicos';
import { ESPECIALIDADES, VIVENCIAS, listar } from '@/domain/catalogo';
import { recomendar } from '@/domain/matching';
import { priorizar, type Prioridade } from '@/domain/prioridade';
import type { EspecialidadeId, PerfilPaciente } from '@/domain/types';
import { Carregando, ChipOpcao, Logo, NivelPill, useCarregar } from '@/shared/ui/componentes';
import { Icone } from '@/shared/ui/Icone';
import { CardRecomendacao } from './CardRecomendacao';
import './recomendacoes.css';

export function Recomendacoes() {
  const { medicas } = useServicos();
  const { perfil, atualizar } = usePerfil() as { perfil: PerfilPaciente; atualizar: (p: Partial<PerfilPaciente>) => void };
  const { dados: lista, carregando } = useCarregar(() => medicas.listar(), [medicas]);

  const resultado = useMemo(() => (lista ? recomendar(perfil, lista) : null), [lista, perfil]);
  const prioridades = useMemo(() => priorizar(perfil).filter((p) => p.nivel !== 'em_dia'), [perfil]);

  const escolherEspecialidade = (e: EspecialidadeId | 'qualquer') => atualizar({ especialidade: e });

  return (
    <main className="tela">
      <header className="rec-cabecalho">
        <Logo tamanho={30} />
        <h1>Médicas com mais afinidade com você</h1>
        {perfil.vivencias.length > 0 && (
          <p className="texto-sec">
            Considerando suas vivências:{' '}
            {perfil.vivencias.map((v) => VIVENCIAS[v].toLowerCase()).join(', ')}.
          </p>
        )}
      </header>

      {prioridades.length > 0 && (
        <section className="secao" aria-labelledby="prioridades">
          <h2 className="rotulo" id="prioridades">O que priorizar agora</h2>
          <div className="rec-grade">
            {prioridades.map((p) => (
              <CardPrioridade
                key={p.exame}
                prioridade={p}
                ativa={perfil.especialidade === p.especialidadeSugerida}
                aoBuscar={() => escolherEspecialidade(p.especialidadeSugerida)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="secao" aria-labelledby="ranking">
        <div className="rec-filtro" role="group" aria-label="Especialidade">
          <ChipOpcao ativo={perfil.especialidade === 'qualquer'} onClick={() => escolherEspecialidade('qualquer')}>
            Todas
          </ChipOpcao>
          {listar(ESPECIALIDADES).map(({ id, rotulo }) => (
            <ChipOpcao key={id} ativo={perfil.especialidade === id} onClick={() => escolherEspecialidade(id)}>
              {rotulo}
            </ChipOpcao>
          ))}
        </div>

        <h2 className="rotulo" id="ranking">
          {resultado ? `Top ${resultado.recomendacoes.length} de ${resultado.totalAvaliadas} médicas verificadas` : 'Recomendações'}
        </h2>

        {carregando || !resultado ? (
          <Carregando texto="Calculando afinidade…" />
        ) : (
          <>
            {perfil.vivencias.length > 0 && !resultado.algumaCompleta && (
              <div className="painel rec-fallback">
                <strong>Nenhuma médica compartilha todas as suas vivências.</strong>
                <span className="texto-sec">
                  Estas são as mais qualificadas e bem avaliadas por mulheres, com o máximo de afinidade possível.
                </span>
              </div>
            )}
            {/* A chave na especialidade reinicia a cascata de entrada quando o filtro muda. */}
            <div className="rec-grade" key={perfil.especialidade}>
              {resultado.recomendacoes.map((r, i) => (
                <CardRecomendacao key={r.medica.id} recomendacao={r} posicao={i + 1} />
              ))}
            </div>
            <p className="aviso">
              <Icone nome="info" tamanho={18} />
              Qualificação e avaliações pesam mais que a vivência no cálculo. A vivência aproxima e desempata.
            </p>
          </>
        )}
      </section>
      <p className="faixa-demo">Protótipo · médicas e avaliações fictícias</p>
    </main>
  );
}

function CardPrioridade({ prioridade: p, ativa, aoBuscar }: { prioridade: Prioridade; ativa: boolean; aoBuscar: () => void }) {
  return (
    <article className="card card-prioridade entra">
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <h3 className="rec-prio-titulo">{p.titulo}</h3>
        <NivelPill nivel={p.nivel} />
      </div>
      <p className="texto-sec">{p.motivo}</p>
      <div className="linha" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <span className="rec-ref">{p.referencia}</span>
        <button type="button" className="btn btn-texto" onClick={aoBuscar} disabled={ativa}>
          {ativa ? `Mostrando ${ESPECIALIDADES[p.especialidadeSugerida].toLowerCase()}` : `Ver ${ESPECIALIDADES[p.especialidadeSugerida].toLowerCase()}`}
          {!ativa && <Icone nome="avancar" tamanho={16} />}
        </button>
      </div>
    </article>
  );
}
