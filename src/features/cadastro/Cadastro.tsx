import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerfil } from '@/app/perfil';
import { ESPECIALIDADES, PREFERENCIAS, VIVENCIAS, listar } from '@/domain/catalogo';
import type { EspecialidadeId, PerfilPaciente, PreferenciaId, TempoDesdeExame, VivenciaId } from '@/domain/types';
import { ChipOpcao, Topo } from '@/shared/ui/componentes';
import { Icone } from '@/shared/ui/Icone';

const TEMPOS: { rotulo: string; valor: TempoDesdeExame }[] = [
  { rotulo: 'Menos de 1 ano', valor: 0 },
  { rotulo: '1 a 2 anos', valor: 1 },
  { rotulo: '2 a 3 anos', valor: 2 },
  { rotulo: 'Mais de 3 anos', valor: 4 },
  { rotulo: 'Nunca fiz', valor: null },
];

const TITULOS = ['Sobre você', 'Suas vivências', 'Como quer ser atendida'];

type Rascunho = Omit<PerfilPaciente, 'mamografiaHaAnos' | 'preventivoHaAnos'> & {
  mamografiaHaAnos: TempoDesdeExame | undefined;
  preventivoHaAnos: TempoDesdeExame | undefined;
};

const alternar = <T,>(lista: T[], item: T) => (lista.includes(item) ? lista.filter((x) => x !== item) : [...lista, item]);

export function Cadastro() {
  const navegar = useNavigate();
  const { perfil, salvar } = usePerfil();
  const [passo, setPasso] = useState(0);
  const [direcao, setDirecao] = useState<'avancar' | 'voltar'>('avancar');
  const irPara = (n: number) => {
    setDirecao(n > passo ? 'avancar' : 'voltar');
    setPasso(n);
  };
  const [r, setR] = useState<Rascunho>(
    () =>
      perfil ?? {
        idade: null,
        mamografiaHaAnos: undefined,
        preventivoHaAnos: undefined,
        historicoFamiliarMama: false,
        vivencias: [],
        especialidade: 'qualquer',
        preferencias: [],
      },
  );
  const mudar = (parcial: Partial<Rascunho>) => setR((atual) => ({ ...atual, ...parcial }));

  const passoValido =
    passo !== 0 || (r.idade !== null && r.idade >= 12 && r.idade <= 110 && r.mamografiaHaAnos !== undefined && r.preventivoHaAnos !== undefined);

  const avancar = () => {
    if (passo < 2) return irPara(passo + 1);
    salvar({ ...r, mamografiaHaAnos: r.mamografiaHaAnos ?? null, preventivoHaAnos: r.preventivoHaAnos ?? null });
    navegar('/recomendacoes');
  };

  return (
    <>
      {/* Em passos internos, "voltar" retorna um passo em vez de sair do cadastro. */}
      <Topo titulo={TITULOS[passo]} voltarPara="/" aoVoltar={passo > 0 ? () => irPara(passo - 1) : undefined}>
        <span className="texto-sec num">{passo + 1}/3</span>
      </Topo>
      <main className="tela tela-estreita">
        <div className="passos" aria-hidden>
          {TITULOS.map((t, i) => (
            <span key={t} data-ativo={i <= passo} />
          ))}
        </div>

        <div key={passo} className="passo-anim" data-direcao={direcao}>

        {passo === 0 && (
          <>
            <div className="campo">
              <label htmlFor="idade">Qual a sua idade?</label>
              <input
                id="idade"
                className="entrada"
                type="number"
                inputMode="numeric"
                min={12}
                max={110}
                placeholder="Ex.: 47"
                value={r.idade ?? ''}
                onChange={(e) => mudar({ idade: e.target.value ? Number(e.target.value) : null })}
              />
            </div>
            <EscolhaTempo
              id="mamografia"
              pergunta="Quando foi sua última mamografia?"
              valor={r.mamografiaHaAnos}
              aoMudar={(v) => mudar({ mamografiaHaAnos: v })}
            />
            <EscolhaTempo
              id="preventivo"
              pergunta="E o último preventivo (Papanicolau)?"
              valor={r.preventivoHaAnos}
              aoMudar={(v) => mudar({ preventivoHaAnos: v })}
            />
            <label className="check">
              <input
                id="familia"
                type="checkbox"
                checked={r.historicoFamiliarMama}
                onChange={(e) => mudar({ historicoFamiliarMama: e.target.checked })}
              />
              <span>Tenho mãe, irmã ou filha que teve câncer de mama</span>
            </label>
            <p className="aviso">
              <Icone nome="info" tamanho={18} />
              Usamos essas respostas para dizer quais exames priorizar. Não substituem a avaliação médica.
            </p>
          </>
        )}

        {passo === 1 && (
          <>
            <p>Marque o que você vive ou já viveu. Vamos procurar médicas que passaram por algo parecido.</p>
            <div className="linha-wrap">
              {listar(VIVENCIAS).map(({ id, rotulo }) => (
                <ChipOpcao
                  key={id}
                  ativo={r.vivencias.includes(id)}
                  onClick={() => mudar({ vivencias: alternar<VivenciaId>(r.vivencias, id) })}
                >
                  {rotulo}
                </ChipOpcao>
              ))}
            </div>
            <p className="aviso">
              <Icone nome="cadeado" tamanho={18} />
              Esse é um dado de saúde. Ele fica só no seu perfil, serve apenas para a recomendação e você pode apagar quando quiser.
              Se preferir, siga sem marcar nada.
            </p>
          </>
        )}

        {passo === 2 && (
          <>
            <div className="campo">
              <span className="campo-rotulo">Que especialidade você procura?</span>
              <div className="linha-wrap">
                <ChipOpcao ativo={r.especialidade === 'qualquer'} onClick={() => mudar({ especialidade: 'qualquer' })}>
                  Ainda não sei
                </ChipOpcao>
                {listar(ESPECIALIDADES).map(({ id, rotulo }) => (
                  <ChipOpcao
                    key={id}
                    ativo={r.especialidade === id}
                    onClick={() => mudar({ especialidade: id as EspecialidadeId })}
                  >
                    {rotulo}
                  </ChipOpcao>
                ))}
              </div>
            </div>
            <div className="campo">
              <span className="campo-rotulo">O que é importante no atendimento?</span>
              <div className="linha-wrap">
                {listar(PREFERENCIAS).map(({ id, rotulo }) => (
                  <ChipOpcao
                    key={id}
                    ativo={r.preferencias.includes(id)}
                    onClick={() => mudar({ preferencias: alternar<PreferenciaId>(r.preferencias, id) })}
                  >
                    {rotulo}
                  </ChipOpcao>
                ))}
              </div>
            </div>
          </>
        )}
        </div>
      </main>

      <div className="acoes-fixas">
        {passo > 0 && (
          <button type="button" className="btn btn-secundario" onClick={() => irPara(passo - 1)}>
            Voltar
          </button>
        )}
        <button type="button" className="btn btn-primario" disabled={!passoValido} onClick={avancar}>
          {passo < 2 ? 'Continuar' : 'Ver minhas médicas'}
        </button>
      </div>
    </>
  );
}

function EscolhaTempo({
  id,
  pergunta,
  valor,
  aoMudar,
}: {
  id: string;
  pergunta: string;
  valor: TempoDesdeExame | undefined;
  aoMudar: (v: TempoDesdeExame) => void;
}) {
  return (
    <div className="campo" role="group" aria-labelledby={`${id}-rotulo`}>
      <span className="campo-rotulo" id={`${id}-rotulo`}>
        {pergunta}
      </span>
      <div className="linha-wrap">
        {TEMPOS.map((t) => (
          <ChipOpcao key={t.rotulo} ativo={valor === t.valor} onClick={() => aoMudar(t.valor)}>
            {t.rotulo}
          </ChipOpcao>
        ))}
      </div>
    </div>
  );
}
