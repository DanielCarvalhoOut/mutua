import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePerfil } from '@/app/perfil';
import { useServicos } from '@/app/servicos';
import { ESPECIALIDADES, listar } from '@/domain/catalogo';
import {
  agoraLocal,
  podeConfirmar,
  siglaConselho,
  montarDenuncia,
  MOTIVO_MAXIMO,
  MOTIVO_MINIMO,
  rascunhoVazio,
  TIPOS_OCORRENCIA,
  validarDenuncia,
  type ComprovanteDenuncia,
  type RascunhoDenuncia,
} from '@/domain/denuncia';
import { ChipOpcao, Toast, Topo, useCarregar } from '@/shared/ui/componentes';
import { Icone } from '@/shared/ui/Icone';
import './denuncia.css';

type Etapa = 'formulario' | 'confirmacao' | 'sucesso';

const TITULOS: Record<Etapa, string> = {
  formulario: 'Reportar um problema',
  confirmacao: 'Confirme sua denúncia',
  sucesso: 'Denúncia registrada',
};

const formatarData = (valor: string) =>
  new Date(valor).toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export function Denuncia() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { medicas, denuncias, perfil } = useServicos();
  const { ocultarMedica } = usePerfil();
  const { dados: lista } = useCarregar(() => medicas.listar(), [medicas]);

  const [r, setR] = useState<RascunhoDenuncia>(() => rascunhoVazio(id ?? ''));
  const [tocados, setTocados] = useState<Partial<Record<keyof RascunhoDenuncia, boolean>>>({});
  const [etapa, setEtapa] = useState<Etapa>('formulario');
  const [direcao, setDirecao] = useState<'avancar' | 'voltar'>('avancar');
  const [declaro, setDeclaro] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [comprovante, setComprovante] = useState<ComprovanteDenuncia | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fecharToast = useCallback(() => setToast(null), []);

  const erros = validarDenuncia(r);
  const valido = Object.keys(erros).length === 0;
  const medica = lista?.find((m) => m.id === r.medicaId);
  const crm = medica ? siglaConselho(medica.registro) : 'CRM do estado';
  const motivoLen = r.motivo.trim().length;

  const mudar = (parcial: Partial<RascunhoDenuncia>) => {
    setR((atual) => ({ ...atual, ...parcial }));
    setTocados((t) => ({ ...t, ...Object.fromEntries(Object.keys(parcial).map((k) => [k, true])) }));
  };
  const erroDe = (campo: keyof RascunhoDenuncia) => (tocados[campo] ? erros[campo] : undefined);

  const irPara = (nova: Etapa, dir: 'avancar' | 'voltar') => {
    setDirecao(dir);
    setEtapa(nova);
    window.scrollTo(0, 0);
  };

  const voltar = () => {
    if (etapa === 'confirmacao') irPara('formulario', 'voltar');
    else if (etapa === 'sucesso') navegar('/recomendacoes');
    else navegar(-1);
  };

  const confirmar = async () => {
    setEnviando(true);
    setErroEnvio(null);
    try {
      const recibo = await denuncias.registrar(montarDenuncia(r, perfil.identificador(), medica?.registro.uf ?? 'GO'));
      setComprovante(recibo);
      // A médica denunciada sai das recomendações desta paciente.
      ocultarMedica(r.medicaId);
      irPara('sucesso', 'avancar');
    } catch (e) {
      setErroEnvio(e instanceof Error ? e.message : 'Não conseguimos registrar a denúncia agora. Tente de novo.');
    } finally {
      setEnviando(false);
    }
  };

  const copiarProtocolo = async () => {
    if (!comprovante) return;
    try {
      await navigator.clipboard.writeText(comprovante.protocolo);
      setToast('Protocolo copiado');
    } catch {
      setToast('Não deu para copiar. Anote o número da tela.');
    }
  };

  return (
    <>
      <Topo titulo={TITULOS[etapa]} aoVoltar={voltar} />

      <main className="tela tela-estreita">
        <div key={etapa} className="passo-anim" data-direcao={direcao}>
          {etapa === 'formulario' && (
            <>
              <div className="painel den-sigilo">
                <span className="linha" style={{ gap: 8 }}>
                  <Icone nome="escudo" tamanho={18} />
                  <strong>Sua denúncia é sigilosa</strong>
                </span>
                <span className="texto-sec">
                  Na Mútua, a médica não é avisada e nunca tem acesso a ela. Nós encaminhamos a denúncia ao Conselho
                  Regional de Medicina ({crm}) para apuração: você não precisa ir até lá.
                </span>
              </div>

              <div className="campo">
                <label htmlFor="den-medica">Médica</label>
                <select
                  id="den-medica"
                  className="entrada"
                  value={r.medicaId}
                  onChange={(e) => mudar({ medicaId: e.target.value })}
                >
                  <option value="">Escolha a médica</option>
                  {lista?.map((m) => (
                    <option key={m.id} value={m.id}>
                      Dra. {m.nome} ({m.especialidades.map((e) => ESPECIALIDADES[e]).join(', ')})
                    </option>
                  ))}
                </select>
                {erroDe('medicaId') && <span className="erro-campo">{erroDe('medicaId')}</span>}
              </div>

              <div className="campo">
                <label htmlFor="den-data">Quando aconteceu?</label>
                <input
                  id="den-data"
                  className="entrada"
                  type="datetime-local"
                  max={agoraLocal()}
                  value={r.ocorridoEm}
                  onChange={(e) => mudar({ ocorridoEm: e.target.value })}
                />
                {erroDe('ocorridoEm') && <span className="erro-campo">{erroDe('ocorridoEm')}</span>}
              </div>

              <div className="campo" role="group" aria-labelledby="den-tipo">
                <span className="campo-rotulo" id="den-tipo">
                  Tipo de ocorrência
                </span>
                <div className="linha-wrap">
                  {listar(TIPOS_OCORRENCIA).map(({ id: t, rotulo }) => (
                    <ChipOpcao key={t} ativo={r.tipo === t} onClick={() => mudar({ tipo: t })}>
                      {rotulo}
                    </ChipOpcao>
                  ))}
                </div>
              </div>

              <div className="campo">
                <label htmlFor="den-motivo">Explique o motivo da denúncia</label>
                <span className="texto-sec" id="den-motivo-ajuda">
                  Descreva o que aconteceu com o máximo de detalhes que se sentir confortável em compartilhar.
                </span>
                <textarea
                  id="den-motivo"
                  className="entrada den-motivo"
                  aria-describedby="den-motivo-ajuda den-motivo-contador"
                  maxLength={MOTIVO_MAXIMO}
                  value={r.motivo}
                  onChange={(e) => mudar({ motivo: e.target.value })}
                />
                <span
                  id="den-motivo-contador"
                  className={`den-contador ${motivoLen >= MOTIVO_MINIMO ? 'ok' : ''}`}
                  aria-live="polite"
                >
                  {motivoLen < MOTIVO_MINIMO
                    ? `Faltam ${MOTIVO_MINIMO - motivoLen} caracteres (mínimo de ${MOTIVO_MINIMO})`
                    : `${motivoLen}/${MOTIVO_MAXIMO} caracteres`}
                </span>
              </div>

              <div className="campo" role="group" aria-labelledby="den-anonima">
                <span className="campo-rotulo" id="den-anonima">
                  Deseja que a denúncia seja anônima?
                </span>
                <div className="segmentado den-sim-nao">
                  <button type="button" aria-pressed={r.anonima === true} onClick={() => mudar({ anonima: true })}>
                    Sim
                  </button>
                  <button type="button" aria-pressed={r.anonima === false} onClick={() => mudar({ anonima: false })}>
                    Não
                  </button>
                </div>
                {r.anonima !== null && (
                  <span className="texto-sec">
                    {r.anonima
                      ? `Seus dados não ficam ligados à denúncia e não vão para o ${crm}. Você acompanha pelo número de protocolo.`
                      : `A equipe da Mútua e o ${crm} poderão falar com você se precisarem de mais detalhes.`}
                  </span>
                )}
              </div>

              <ApoioImediato />
            </>
          )}

          {etapa === 'confirmacao' && (
            <>
              <dl className="card den-resumo">
                <Item rotulo="Médica" valor={medica ? `Dra. ${medica.nome}` : r.medicaId} />
                <Item rotulo="Quando aconteceu" valor={formatarData(r.ocorridoEm)} />
                <Item rotulo="Tipo de ocorrência" valor={r.tipo ? TIPOS_OCORRENCIA[r.tipo] : ''} />
                <Item rotulo="Denúncia anônima" valor={r.anonima ? 'Sim' : 'Não'} />
                <Item rotulo="Encaminhamento" valor={`${crm} (Conselho Regional de Medicina)`} />
                <div className="den-item">
                  <dt>Motivo</dt>
                  <dd className="den-motivo-lido">{r.motivo.trim()}</dd>
                </div>
              </dl>

              <p className="aviso">
                <Icone nome="cadeado" tamanho={18} />
                Confirme que as informações são verdadeiras. Sua denúncia será tratada com sigilo.
              </p>

              <label className="check">
                <input id="den-declaro" type="checkbox" checked={declaro} onChange={(e) => setDeclaro(e.target.checked)} />
                <span>Declaro que as informações fornecidas são verdadeiras.</span>
              </label>

              {r.anonima ? (
                <p className="aviso">
                  <Icone nome="info" tamanho={18} />
                  A denúncia vai ao {crm} sem seus dados. O conselho pode apurar por conta própria, mas não conseguirá
                  falar com você.
                </p>
              ) : (
                <>
                  <label className="check">
                    <input
                      id="den-autoriza-crm"
                      type="checkbox"
                      checked={r.autorizaCrm}
                      onChange={(e) => setR((atual) => ({ ...atual, autorizaCrm: e.target.checked }))}
                    />
                    <span>
                      Autorizo a Mútua a enviar meus dados de contato ao {crm} junto com a denúncia, para que o conselho
                      possa falar comigo.
                    </span>
                  </label>
                  <p className="aviso">
                    <Icone nome="info" tamanho={18} />
                    Se o conselho abrir um processo, a médica tem direito de defesa e pode conhecer a denúncia, como em
                    qualquer apuração do CRM. Se preferir não ser identificada, volte e marque a denúncia como anônima.
                  </p>
                </>
              )}

              {erroEnvio && (
                <p className="painel den-erro" role="alert">
                  {erroEnvio}
                </p>
              )}
            </>
          )}

          {etapa === 'sucesso' && comprovante && (
            <>
              <div className="den-sucesso">
                <span className="den-sucesso-icone">
                  <Icone nome="check" tamanho={34} />
                </span>
                <h1>Recebemos sua denúncia</h1>
                <p className="texto-sec">Sua denúncia foi registrada com sucesso e será analisada com sigilo.</p>
              </div>

              <div className="den-balao" role="status">
                <Icone nome="info" tamanho={20} />
                <span>
                  <strong>
                    {medica ? `Dra. ${medica.nome}` : 'Essa profissional'} não vai mais aparecer nas suas recomendações.
                  </strong>
                  <span>Em caso de dúvidas, entre em contato com o suporte.</span>
                </span>
              </div>

              <ol className="card den-etapas" aria-label="Próximos passos">
                <li data-estado="feito">
                  <span className="den-etapa-marca">
                    <Icone nome="check" tamanho={14} />
                  </span>
                  <span>
                    <strong>Registrada na Mútua</strong>
                    <span className="texto-sec">Nossa equipe de análise já recebeu.</span>
                  </span>
                </li>
                <li data-estado="proximo">
                  <span className="den-etapa-marca" />
                  <span>
                    <strong>Encaminhada ao {comprovante.conselho}</strong>
                    <span className="texto-sec">Nós enviamos ao conselho. Você não precisa ir até lá.</span>
                  </span>
                </li>
                <li data-estado="depois">
                  <span className="den-etapa-marca" />
                  <span>
                    <strong>Apuração pelo {comprovante.conselho}</strong>
                    <span className="texto-sec">O conselho analisa o caso e decide se abre uma sindicância.</span>
                  </span>
                </li>
              </ol>

              <div className="card den-protocolo">
                <span className="rotulo">Número de protocolo</span>
                <strong className="num">{comprovante.protocolo}</strong>
                <span className="texto-sec">Guarde este número para acompanhar a análise.</span>
                <button type="button" className="btn btn-texto" onClick={copiarProtocolo}>
                  Copiar protocolo
                </button>
              </div>

              <ApoioImediato />
            </>
          )}
        </div>
      </main>

      <div className="acoes-fixas">
        {etapa === 'formulario' && (
          <>
            <button type="button" className="btn btn-secundario" onClick={() => navegar(-1)}>
              Cancelar
            </button>
            <button type="button" className="btn btn-primario" disabled={!valido} onClick={() => irPara('confirmacao', 'avancar')}>
              Continuar
            </button>
          </>
        )}
        {etapa === 'confirmacao' && (
          <>
            <button type="button" className="btn btn-secundario" onClick={() => irPara('formulario', 'voltar')}>
              Voltar e editar
            </button>
            <button type="button" className="btn btn-primario" disabled={!podeConfirmar(r, declaro) || enviando} onClick={confirmar}>
              {enviando ? 'Enviando…' : 'Confirmar denúncia'}
            </button>
          </>
        )}
        {etapa === 'sucesso' && (
          <button type="button" className="btn btn-primario" onClick={() => navegar('/recomendacoes')}>
            Voltar ao início
          </button>
        )}
      </div>
      <Toast mensagem={toast} aoFechar={fecharToast} />
    </>
  );
}

function Item({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="den-item">
      <dt>{rotulo}</dt>
      <dd>{valor}</dd>
    </div>
  );
}

/** Canais oficiais para quando a situação não pode esperar a análise. */
function ApoioImediato() {
  return (
    <div className="painel">
      <span className="rotulo">Se precisar de ajuda agora</span>
      <span>
        Em perigo, ligue <strong className="num">190</strong>. Para orientação sobre violência contra a mulher, ligue{' '}
        <strong className="num">180</strong>, gratuito e 24 horas.
      </span>
    </div>
  );
}
