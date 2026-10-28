// Adaptadores locais: dados fictícios em memória + avaliações novas salvas no navegador.
// Implementam as mesmas portas que o backend vai implementar.

import type { AvaliacaoRepository, MedicaRepository, PerfilRepository } from '@/domain/ports';
import type { Avaliacao, CriterioId, Medica, NovaAvaliacao, PerfilPaciente } from '@/domain/types';
import { gravarJson, lerJson, remover } from '../storage';
import { AVALIACOES, MEDICAS } from './seed';

const CHAVE_AVALIACOES = 'mutua:avaliacoes:v1';
const CHAVE_PERFIL = 'mutua:perfil:v1';

const atraso = <T,>(valor: T) => new Promise<T>((ok) => setTimeout(() => ok(valor), 120));

export class LocalAvaliacaoRepository implements AvaliacaoRepository {
  private novas: Avaliacao[] = lerJson<Avaliacao[]>(CHAVE_AVALIACOES, []);

  async listarPorMedica(medicaId: string): Promise<Avaliacao[]> {
    const todas = [...this.novas, ...AVALIACOES].filter((a) => a.medicaId === medicaId);
    return atraso(todas.sort((a, b) => b.data.localeCompare(a.data)));
  }

  async registrar(nova: NovaAvaliacao): Promise<Avaliacao> {
    const avaliacao: Avaliacao = {
      ...nova,
      id: `local-${Date.now().toString(36)}`,
      data: new Date().toISOString(),
    };
    this.novas = [avaliacao, ...this.novas];
    gravarJson(CHAVE_AVALIACOES, this.novas);
    return atraso(avaliacao);
  }

  /** Avaliações feitas neste aparelho, usadas para atualizar o resumo de cada médica. */
  novasDa(medicaId: string): Avaliacao[] {
    return this.novas.filter((a) => a.medicaId === medicaId);
  }
}

/** Junta ao resumo base as avaliações novas, como o backend faria ao recalcular agregados. */
function consolidar(medica: Medica, novas: Avaliacao[]): Medica {
  if (!novas.length) return medica;
  const base = medica.avaliacoes;
  const total = base.total + novas.length;
  const media = (base.media * base.total + novas.reduce((s, a) => s + a.nota, 0)) / total;
  const criterios = { ...base.criterios };
  for (const c of Object.keys(criterios) as CriterioId[]) {
    const marcados = novas.filter((a) => a.criterios[c]).length;
    criterios[c] = (base.criterios[c] * base.total + marcados) / total;
  }
  return { ...medica, avaliacoes: { total, media, criterios } };
}

export class MockMedicaRepository implements MedicaRepository {
  constructor(private readonly avaliacoes: LocalAvaliacaoRepository) {}

  async listar(filtro?: { especialidade?: Medica['especialidades'][number] }): Promise<Medica[]> {
    const lista = MEDICAS.filter((m) => !filtro?.especialidade || m.especialidades.includes(filtro.especialidade));
    return atraso(lista.map((m) => consolidar(m, this.avaliacoes.novasDa(m.id))));
  }

  async buscarPorId(id: string): Promise<Medica | null> {
    const medica = MEDICAS.find((m) => m.id === id);
    return atraso(medica ? consolidar(medica, this.avaliacoes.novasDa(id)) : null);
  }
}

export class LocalPerfilRepository implements PerfilRepository {
  carregar(): PerfilPaciente | null {
    return lerJson<PerfilPaciente | null>(CHAVE_PERFIL, null);
  }
  salvar(perfil: PerfilPaciente): void {
    gravarJson(CHAVE_PERFIL, perfil);
  }
  limpar(): void {
    remover(CHAVE_PERFIL);
  }
}
