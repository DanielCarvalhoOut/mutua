import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePerfil } from '@/app/perfil';
import { useServicos } from '@/app/servicos';
import { CRITERIOS, VIVENCIAS, listar } from '@/domain/catalogo';
import type { CriterioId, VivenciaId } from '@/domain/types';
import { ChipOpcao, Topo } from '@/shared/ui/componentes';
import { Estrela, Icone } from '@/shared/ui/Icone';

const FAIXAS = ['18 a 24 anos', '25 a 29 anos', '30 a 34 anos', '35 a 39 anos', '40 a 44 anos', '45 a 49 anos', '50 a 54 anos', '55 a 59 anos', '60 a 64 anos', '65 anos ou mais'];

function faixaDaIdade(idade: number | null | undefined): string {
  if (!idade) return FAIXAS[3];
  if (idade < 25) return FAIXAS[0];
  if (idade >= 65) return FAIXAS[9];
  return FAIXAS[Math.min(8, Math.floor((idade - 25) / 5) + 1)];
}

export function NovaAvaliacao() {
  const { id = '' } = useParams();
  const navegar = useNavigate();
  const { avaliacoes } = useServicos();
  const { perfil } = usePerfil();

  const [nota, setNota] = useState(0);
  const [criterios, setCriterios] = useState<Partial<Record<CriterioId, boolean>>>({});
  const [texto, setTexto] = useState('');
  const [vivencias, setVivencias] = useState<VivenciaId[]>(perfil?.vivencias ?? []);
  const [faixa, setFaixa] = useState(faixaDaIdade(perfil?.idade));
  const [codigo, setCodigo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const valido = nota > 0 && texto.trim().length >= 10;

  const publicar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valido) return;
    setEnviando(true);
    await avaliacoes.registrar({
      medicaId: id,
      nota,
      texto: texto.trim(),
      criterios,
      autora: { faixaEtaria: faixa, vivencias },
      // Na versão integrada, o código vem da agenda parceira e é conferido no servidor.
      consultaVerificada: codigo.trim().length >= 4,
    });
    navegar(`/medica/${id}`, { replace: true, state: { toast: 'Avaliação publicada' } });
  };

  return (
    <>
      <Topo titulo="Avaliar consulta" />
      <form className="tela" onSubmit={publicar} id="form-avaliacao">
        <div className="campo">
          <span className="campo-rotulo">Como foi a consulta?</span>
          <div className="estrelas-input linha" role="group" aria-label="Nota">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" aria-pressed={nota >= n} aria-label={`${n} de 5`} onClick={() => setNota(n)}>
                <Estrela tamanho={34} />
              </button>
            ))}
          </div>
        </div>

        <div className="campo">
          <span className="campo-rotulo">O que aconteceu na consulta?</span>
          {(listar(CRITERIOS) as { id: CriterioId; rotulo: string }[]).map(({ id: c, rotulo }) => (
            <label key={c} className="check">
              <input
                id={`criterio-${c}`}
                type="checkbox"
                checked={!!criterios[c]}
                onChange={(e) => setCriterios((atual) => ({ ...atual, [c]: e.target.checked }))}
              />
              <span>{rotulo}</span>
            </label>
          ))}
        </div>

        <div className="campo">
          <label htmlFor="texto">Conte para outras mulheres</label>
          <textarea
            id="texto"
            className="entrada"
            placeholder="O que ajudou ou atrapalhou? Como você se sentiu?"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={600}
          />
        </div>

        <div className="campo">
          <span className="campo-rotulo">Suas vivências (opcional)</span>
          <span className="texto-sec">Aparecem na avaliação para ajudar mulheres parecidas com você. Seu nome nunca aparece.</span>
          <div className="linha-wrap">
            {listar(VIVENCIAS).map(({ id: v, rotulo }) => (
              <ChipOpcao
                key={v}
                ativo={vivencias.includes(v)}
                onClick={() => setVivencias((l) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]))}
              >
                {rotulo}
              </ChipOpcao>
            ))}
          </div>
        </div>

        <div className="campo">
          <label htmlFor="faixa">Faixa etária</label>
          <select id="faixa" className="entrada" value={faixa} onChange={(e) => setFaixa(e.target.value)}>
            {FAIXAS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label htmlFor="codigo">Código da consulta (opcional)</label>
          <input
            id="codigo"
            className="entrada"
            placeholder="Ex.: MT-4821"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
          <span className="texto-sec">Com o código do agendamento, sua avaliação recebe o selo de consulta verificada.</span>
        </div>

        <p className="aviso">
          <Icone nome="cadeado" tamanho={18} />
          Depois de publicada, a médica não pode editar nem apagar sua avaliação.
        </p>
      </form>
      <div className="acoes-fixas">
        <button type="submit" form="form-avaliacao" className="btn btn-primario" disabled={!valido || enviando}>
          {enviando ? 'Publicando…' : 'Publicar avaliação'}
        </button>
      </div>
    </>
  );
}
