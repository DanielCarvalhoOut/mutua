import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePerfil } from '@/app/perfil';
import { useServicos } from '@/app/servicos';
import { ESPECIALIDADES, VIVENCIAS, listar } from '@/domain/catalogo';
import { recomendar } from '@/domain/matching';
import { priorizar, type Prioridade } from '@/domain/prioridade';
import type { EspecialidadeId, PerfilPaciente } from '@/domain/types';
import { Carregando, ChipOpcao, Logo, NivelPill, useCarregar } from '@/shared/ui/componentes';
import { Icone } from '@/shared/ui/Icone';
import { Tour, type PassoTour } from '@/shared/ui/Tour';
import { CardRecomendacao } from './CardRecomendacao';
import './recomendacoes.css';

const PASSOS_TOUR: PassoTour[] = [
  {
    alvo: 'prioridade',
    titulo: 'O que priorizar agora',
    texto: 'Pela sua idade e pelos seus últimos exames, mostramos o que está mais urgente e com qual especialista ir.',
  },
  {
    alvo: 'filtro',
    titulo: 'Filtre por especialidade',
    texto: 'Toque em uma ou mais especialidades e o ranking é recalculado na hora. "Todas" limpa o filtro.',
  },
  {
    alvo: 'card',
    titulo: 'Sua afinidade com cada médica',
    texto: 'A % junta qualificação, avaliações de mulheres, vivências em comum e suas preferências. Qualificação e avaliações pesam mais.',
  },
  {
    alvo: 'correspondencia',
    titulo: 'O que ela tem e o que não tem',
    texto: 'Com ✓, o que ela atende do que você pediu. Riscado, o que falta. Assim você decide sem surpresa.',
  },
  {
    alvo: 'ver-perfil',
    titulo: 'Conheça a médica',
    texto: 'No perfil estão as avaliações escritas só por mulheres, as vivências que ela compartilha e o botão para agendar.',
  },
  {
    alvo: 'nav-perfil',
    titulo: 'Seu espaço',
    texto: 'Em Meu perfil você edita suas respostas, escolhe o tema claro ou escuro e pode reportar um problema com sigilo.',
  },
];

export function Recomendacoes() {
  const { medicas } = useServicos();
  const { perfil, atualizar, ocultas } = usePerfil() as ReturnType<typeof usePerfil> & { perfil: PerfilPaciente };
  const { dados: lista, carregando } = useCarregar(() => medicas.listar(), [medicas]);

  const resultado = useMemo(() => (lista ? recomendar(perfil, lista, 5, ocultas) : null), [lista, perfil, ocultas]);
  const prioridades = useMemo(() => priorizar(perfil).filter((p) => p.nivel !== 'em_dia'), [perfil]);

  // Filtro de múltipla escolha: cada toque liga ou desliga uma especialidade; "Todas" limpa.
  const alternarEspecialidade = (e: EspecialidadeId) =>
    atualizar({
      especialidades: perfil.especialidades.includes(e)
        ? perfil.especialidades.filter((x) => x !== e)
        : [...perfil.especialidades, e],
    });
  const incluirEspecialidade = (e: EspecialidadeId) =>
    !perfil.especialidades.includes(e) && atualizar({ especialidades: [...perfil.especialidades, e] });

  // O tour abre quando a tela é aberta pedindo por ele (perfil de exemplo, perfil novo ou "Rever o tour").
  const local = useLocation();
  const navegar = useNavigate();
  const [tourAtivo, setTourAtivo] = useState(() => (local.state as { tour?: boolean } | null)?.tour === true);
  useEffect(() => {
    // Tira o pedido do histórico: recarregar a página não reabre o tour.
    if (tourAtivo) navegar(local.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const encerrarTour = useCallback(() => setTourAtivo(false), []);

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
        <section className="secao" aria-labelledby="prioridades" data-tour="prioridade">
          <h2 className="rotulo" id="prioridades">O que priorizar agora</h2>
          <div className="rec-grade">
            {prioridades.map((p) => (
              <CardPrioridade
                key={p.exame}
                prioridade={p}
                ativa={perfil.especialidades.includes(p.especialidadeSugerida)}
                aoBuscar={() => incluirEspecialidade(p.especialidadeSugerida)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="secao" aria-labelledby="ranking">
        <div className="rec-filtro" role="group" aria-label="Especialidade" data-tour="filtro">
          <ChipOpcao ativo={perfil.especialidades.length === 0} onClick={() => atualizar({ especialidades: [] })}>
            Todas
          </ChipOpcao>
          {listar(ESPECIALIDADES).map(({ id, rotulo }) => (
            <ChipOpcao key={id} ativo={perfil.especialidades.includes(id)} onClick={() => alternarEspecialidade(id)}>
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
            <div className="rec-grade" key={perfil.especialidades.join(',')}>
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
      {tourAtivo && resultado && !carregando && <Tour passos={PASSOS_TOUR} aoTerminar={encerrarTour} />}
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
