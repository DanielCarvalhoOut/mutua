import { useCallback, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { usePerfil } from '@/app/perfil';
import { useServicos } from '@/app/servicos';
import { CRITERIOS, ESPECIALIDADES, PREFERENCIAS, VIVENCIAS } from '@/domain/catalogo';
import { avaliarMedica, PESOS } from '@/domain/matching';
import { afinidade } from '@/domain/resumo';
import type { Avaliacao, CriterioId } from '@/domain/types';
import {
  AnelMatch,
  Avatar,
  Barra,
  Carregando,
  decimal,
  Estrelas,
  SeloVerificado,
  Toast,
  Topo,
  useCarregar,
} from '@/shared/ui/componentes';
import { Icone } from '@/shared/ui/Icone';
import { Agendar } from './Agendar';
import './medica.css';

const NOMES_COMPONENTES = {
  qualificacao: 'Qualificação',
  avaliacoes: 'Avaliações de mulheres',
  vivencias: 'Vivências em comum',
  preferencias: 'Suas preferências',
} as const;

export function PerfilMedica() {
  const { id = '' } = useParams();
  const navegar = useNavigate();
  const local = useLocation();
  const { medicas, avaliacoes, resumo } = useServicos();
  const { perfil } = usePerfil();
  const [agendando, setAgendando] = useState(false);
  const [toast, setToast] = useState<string | null>((local.state as { toast?: string } | null)?.toast ?? null);
  const fecharToast = useCallback(() => setToast(null), []);

  const { dados, carregando } = useCarregar(async () => {
    const [medica, lista] = await Promise.all([medicas.buscarPorId(id), avaliacoes.listarPorMedica(id)]);
    const texto = medica ? await resumo.resumir({ medica, avaliacoes: lista, perfil }) : '';
    return { medica, lista, texto };
  }, [id, perfil]);

  const rec = useMemo(() => (dados?.medica && perfil ? avaliarMedica(perfil, dados.medica) : null), [dados, perfil]);
  const af = useMemo(() => (dados && perfil ? afinidade(dados.lista, perfil.vivencias) : null), [dados, perfil]);

  if (carregando || !dados) {
    return (
      <>
        <Topo titulo="Perfil" />
        <Carregando />
      </>
    );
  }
  const { medica: m, lista, texto } = dados;
  if (!m) {
    return (
      <>
        <Topo titulo="Perfil" voltarPara="/recomendacoes" />
        <main className="tela">
          <p>Não encontramos essa médica.</p>
        </main>
      </>
    );
  }

  const primeiroNome = m.nome.split(' ')[0];

  return (
    <>
      <Topo titulo={`Dra. ${m.nome}`} voltarPara="/recomendacoes" />
      <main className="tela">
        {/* Duas colunas no tablet/desktop: quem ela é à esquerda, o que dizem dela à direita. */}
        <div className="med-grade">
        <div className="med-col">
        <section className="med-hero">
          <Avatar nome={m.nome} tamanho={76} />
          <div className="med-hero-id">
            <h1>Dra. {m.nome}</h1>
            <span className="texto-sec">
              {m.especialidades.map((e) => ESPECIALIDADES[e]).join(' e ')} · {m.bairro}, {m.cidade}
            </span>
            <SeloVerificado texto={`CRM-${m.registro.uf} ${m.registro.crm} verificado`} />
            {m.registro.rqe && <SeloVerificado texto={`RQE ${m.registro.rqe} · especialista`} />}
          </div>
        </section>

        {rec && (
          <section className="card med-match">
            <div className="linha" style={{ gap: 16 }}>
              <AnelMatch valor={rec.score} tamanho={92} />
              <div className="secao" style={{ gap: 4, minWidth: 0 }}>
                <strong>Por que ela aparece para você</strong>
                <span className="texto-sec">A qualificação e as avaliações pesam mais que a vivência.</span>
              </div>
            </div>
            {(Object.keys(NOMES_COMPONENTES) as (keyof typeof NOMES_COMPONENTES)[])
              .filter((c) => rec.componentes[c] !== undefined)
              .map((c) => (
                <Barra
                  key={c}
                  rotulo={`${NOMES_COMPONENTES[c]} · peso ${Math.round(PESOS[c] * 100)}%`}
                  valor={rec.componentes[c]!}
                />
              ))}
          </section>
        )}

        <section className="secao">
          <h2 className="secao-titulo">Sobre</h2>
          <p>{m.bio}</p>
          <p className="texto-sec">
            {m.formacao} · {m.anosExperiencia} anos de experiência
          </p>
        </section>

        {m.vivencias.length > 0 && (
          <section className="secao">
            <h2 className="secao-titulo">Vivências que ela compartilha</h2>
            <div className="linha-wrap">
              {m.vivencias.map((v) => (
                <span key={v.id} className="chip chip-vivencia">
                  {perfil?.vivencias.includes(v.id) && <Icone nome="coracao" tamanho={14} />}
                  {VIVENCIAS[v.id]}
                </span>
              ))}
            </div>
            <p className="aviso">
              <Icone nome="cadeado" tamanho={18} />
              Vivência autodeclarada pela médica, com consentimento explícito (LGPD). Ela pode retirar a qualquer momento.
            </p>
          </section>
        )}

        <section className="secao">
          <h2 className="secao-titulo">Atendimento</h2>
          <div className="linha-wrap">
            {m.atendimento.map((a) => (
              <span key={a} className="chip chip-neutro">
                {perfil?.preferencias.includes(a) && <Icone nome="check" tamanho={14} />}
                {PREFERENCIAS[a]}
              </span>
            ))}
          </div>
        </section>

        </div>
        <div className="med-col">
        <section className="secao">
          <div className="linha" style={{ justifyContent: 'space-between' }}>
            <h2 className="secao-titulo">Avaliações de mulheres</h2>
            <span className="linha" style={{ gap: 6 }}>
              <Estrelas nota={m.avaliacoes.media} />
              <span className="num">{decimal(m.avaliacoes.media)}</span>
            </span>
          </div>
          <span className="texto-sec">{m.avaliacoes.total} avaliações, escritas só por mulheres</span>

          <div className="card med-resumo">
            <span className="linha rotulo med-resumo-rotulo">
              <Icone nome="brilho" tamanho={16} />
              Resumo automático das avaliações
            </span>
            <p>{texto}</p>
          </div>

          {af && (
            <div className="painel">
              <span className="rotulo">Mulheres parecidas com você</span>
              <span>
                Entre quem vive {af.vivencias.map((v) => VIVENCIAS[v].toLowerCase()).join(' ou ')}, a nota é{' '}
                <strong className="num">{decimal(af.media)}</strong> ({af.total} avaliações).
              </span>
            </div>
          )}

          <div className="card">
            {(Object.keys(CRITERIOS) as CriterioId[]).map((c) => (
              <Barra key={c} rotulo={CRITERIOS[c]} valor={m.avaliacoes.criterios[c]} />
            ))}
          </div>

          <p className="aviso">
            <Icone nome="cadeado" tamanho={18} />
            Avaliações protegidas: a médica não edita nem remove. Só a moderação retira uma avaliação, por violação dos termos
            ou ordem judicial.
          </p>

          <div className="med-lista">
            {lista.map((a, i) => (
              <CartaoAvaliacao key={a.id} avaliacao={a} indice={i} />
            ))}
          </div>
          <Link to={`/medica/${m.id}/avaliar`} className="btn btn-secundario btn-bloco">
            <Icone nome="editar" tamanho={18} />
            Avaliar minha consulta com Dra. {primeiroNome}
          </Link>
          <Link to={`/denunciar/${m.id}`} className="btn btn-texto med-reportar">
            <Icone nome="alerta" tamanho={18} />
            Reportar um problema
          </Link>
        </section>
        </div>
        </div>
      </main>

      <div className="acoes-fixas">
        <button type="button" className="btn btn-secundario" onClick={() => navegar('/recomendacoes')}>
          Comparar
        </button>
        <button type="button" className="btn btn-primario" onClick={() => setAgendando(true)}>
          <Icone nome="calendario" tamanho={18} />
          Agendar
        </button>
      </div>

      {agendando && (
        <Agendar
          medica={m}
          aoFechar={() => setAgendando(false)}
          aoConfirmar={(horario) => {
            setAgendando(false);
            setToast(`Pedido enviado para ${horario}`);
          }}
        />
      )}
      <Toast mensagem={toast} aoFechar={fecharToast} />
    </>
  );
}

function CartaoAvaliacao({ avaliacao: a, indice }: { avaliacao: Avaliacao; indice: number }) {
  const data = new Date(a.data.length === 10 ? `${a.data}T12:00:00` : a.data);
  return (
    <article className="card med-avaliacao entra" style={{ ['--i' as string]: Math.min(indice, 5) }}>
      <div className="linha" style={{ justifyContent: 'space-between' }}>
        <Estrelas nota={a.nota} tamanho={15} />
        <span className="texto-sec">{data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      </div>
      <p>{a.texto}</p>
      <div className="linha-wrap" style={{ gap: 6 }}>
        <span className="chip chip-neutro">{a.autora.faixaEtaria}</span>
        {a.autora.vivencias.map((v) => (
          <span key={v} className="chip chip-vivencia">
            {VIVENCIAS[v]}
          </span>
        ))}
      </div>
      {a.consultaVerificada ? (
        <SeloVerificado texto="Consulta verificada" />
      ) : (
        <span className="texto-sec" style={{ fontSize: 'var(--fs-xs)' }}>
          Consulta ainda não verificada
        </span>
      )}
    </article>
  );
}
