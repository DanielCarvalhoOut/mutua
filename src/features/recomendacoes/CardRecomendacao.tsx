import { Link } from 'react-router-dom';
import { ESPECIALIDADES } from '@/domain/catalogo';
import { itensDeCorrespondencia, type Recomendacao } from '@/domain/matching';
import { AnelMatch, Avatar, decimal, pct, SeloVerificado } from '@/shared/ui/componentes';
import { Estrela, Icone } from '@/shared/ui/Icone';

export function CardRecomendacao({
  recomendacao: r,
  posicao,
  rotulo,
}: {
  recomendacao: Recomendacao;
  posicao: number;
  /** Na busca, troca "1ª opção" por "No seu top 5" ou "Fora das recomendações". */
  rotulo?: string;
}) {
  const m = r.medica;
  const itens = itensDeCorrespondencia(r);
  const temVivenciaPedida = r.vivenciasEmComum.length + r.vivenciasFaltando.length > 0;

  return (
    <article
      className="card rec-card entra"
      style={{ ['--i' as string]: posicao - 1 }}
      data-tour={posicao === 1 && !rotulo ? 'card' : undefined}
    >
      <div className="rec-card-topo">
        <Avatar nome={m.nome} foto={m.foto} tamanho={52} />
        <div className="rec-card-id">
          <span className="rotulo">{rotulo ?? `${posicao}ª opção`}</span>
          <h3>Dra. {m.nome}</h3>
          <span className="texto-sec">
            {m.especialidades.map((e) => ESPECIALIDADES[e]).join(' e ')} · {m.bairro}
          </span>
          <SeloVerificado texto={`CRM-${m.registro.uf} verificado${m.registro.rqe ? ' · RQE' : ''}`} />
        </div>
        <AnelMatch valor={r.score} tamanho={62} />
      </div>

      {itens.length > 0 && (
        <ul
          className="correspondencia"
          aria-label="O que ela tem do que você pediu"
          data-tour={posicao === 1 && !rotulo ? 'correspondencia' : undefined}
        >
          {itens.slice(0, 5).map((item) => (
            <li key={item.rotulo} className={item.tem ? 'tem' : 'nao'}>
              <Icone nome={item.tem ? 'check' : 'menos'} tamanho={16} />
              <span>{item.rotulo}</span>
            </li>
          ))}
        </ul>
      )}

      {temVivenciaPedida && !r.correspondenciaCompleta && r.destaques.length > 0 && (
        <div className="painel">
          <span className="rotulo">Por que recomendamos mesmo assim</span>
          {r.destaques.slice(0, 2).map((d) => (
            <span key={d} className="rec-destaque">
              {d}
            </span>
          ))}
        </div>
      )}

      <div className="rec-card-base">
        <span className="linha rec-nota">
          <span className="estrelas">
            <Estrela tamanho={16} />
          </span>
          <span className="num">{decimal(m.avaliacoes.media)}</span>
          <span className="texto-sec">· {m.avaliacoes.total} avaliações</span>
          <span className="texto-sec">· {pct(m.avaliacoes.criterios.respeito)} respeitadas</span>
        </span>
        <Link
          to={`/medica/${m.id}`}
          className="btn btn-secundario rec-ver"
          data-tour={posicao === 1 && !rotulo ? 'ver-perfil' : undefined}
        >
          Ver perfil
        </Link>
      </div>
    </article>
  );
}
