import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePerfil } from '@/app/perfil';
import { ESPECIALIDADES, PREFERENCIAS, VIVENCIAS } from '@/domain/catalogo';
import { priorizar } from '@/domain/prioridade';
import type { TempoDesdeExame } from '@/domain/types';
import { Logo, NivelPill } from '@/shared/ui/componentes';
import { Icone } from '@/shared/ui/Icone';

const tempo = (t: TempoDesdeExame) =>
  t === null ? 'Nunca fez' : t === 0 ? 'Há menos de 1 ano' : t >= 4 ? 'Há mais de 3 anos' : `Há ${t} a ${t + 1} anos`;

export function MeuPerfil() {
  const navegar = useNavigate();
  const { perfil, limpar } = usePerfil();
  const [confirmando, setConfirmando] = useState(false);

  if (!perfil) {
    return (
      <main className="tela">
        <Logo tamanho={30} />
        <p>Você ainda não criou seu perfil.</p>
        <button type="button" className="btn btn-primario" onClick={() => navegar('/comecar')}>
          Criar perfil
        </button>
      </main>
    );
  }

  const prioridades = priorizar(perfil);

  return (
    <main className="tela">
      <Logo tamanho={30} />
      <h1 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800 }}>Meu perfil</h1>

      <section className="card">
        <div className="linha" style={{ justifyContent: 'space-between' }}>
          <strong>{perfil.idade} anos</strong>
          <button type="button" className="btn btn-texto" onClick={() => navegar('/comecar')}>
            <Icone nome="editar" tamanho={16} />
            Editar
          </button>
        </div>
        <Linha rotulo="Última mamografia" valor={tempo(perfil.mamografiaHaAnos)} />
        <Linha rotulo="Último preventivo" valor={tempo(perfil.preventivoHaAnos)} />
        <Linha rotulo="Câncer de mama na família" valor={perfil.historicoFamiliarMama ? 'Sim' : 'Não'} />
        <Linha
          rotulo="Especialidade"
          valor={perfil.especialidade === 'qualquer' ? 'Todas' : ESPECIALIDADES[perfil.especialidade]}
        />
        <Linha
          rotulo="Atendimento"
          valor={perfil.preferencias.length ? perfil.preferencias.map((p) => PREFERENCIAS[p]).join(', ') : 'Sem preferência'}
        />
        <div className="linha-wrap">
          {perfil.vivencias.length ? (
            perfil.vivencias.map((v) => (
              <span key={v} className="chip chip-vivencia">
                {VIVENCIAS[v]}
              </span>
            ))
          ) : (
            <span className="texto-sec">Nenhuma vivência informada</span>
          )}
        </div>
      </section>

      {prioridades.length > 0 && (
        <section className="secao">
          <h2 className="rotulo">Seus exames</h2>
          <div className="card">
            {prioridades.map((p) => (
              <div key={p.exame} className="linha" style={{ justifyContent: 'space-between' }}>
                <span>{p.titulo}</span>
                <NivelPill nivel={p.nivel} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="secao">
        <h2 className="rotulo">Seus dados</h2>
        <p className="aviso">
          <Icone nome="cadeado" tamanho={18} />
          Seus dados de saúde ficam neste aparelho e servem só para a recomendação. Você pode apagar tudo agora.
        </p>
        {confirmando ? (
          <div className="painel">
            <strong>Apagar perfil e vivências?</strong>
            <span className="texto-sec">Suas avaliações publicadas continuam, sem identificar você.</span>
            <div className="linha" style={{ gap: 10, marginTop: 6 }}>
              <button type="button" className="btn btn-secundario" style={{ flex: 1 }} onClick={() => setConfirmando(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primario"
                style={{ flex: 1 }}
                onClick={() => {
                  limpar();
                  navegar('/');
                }}
              >
                Apagar
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-secundario" onClick={() => setConfirmando(true)}>
            <Icone nome="lixeira" tamanho={18} />
            Apagar meus dados
          </button>
        )}
      </section>
      <p className="faixa-demo">Mútua · cuidado de quem também viveu</p>
    </main>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="linha" style={{ justifyContent: 'space-between', gap: 12, fontSize: 'var(--fs-sm)' }}>
      <span className="texto-sec">{rotulo}</span>
      <span style={{ textAlign: 'right', fontWeight: 700 }}>{valor}</span>
    </div>
  );
}
