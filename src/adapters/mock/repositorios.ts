// Adaptadores locais: dados fictícios em memória + avaliações novas salvas no navegador.
// Implementam as mesmas portas que o backend vai implementar.

import { gerarProtocolo, type ComprovanteDenuncia, type Denuncia, type NovaDenuncia } from '@/domain/denuncia';
import type { AvaliacaoRepository, DenunciaRepository, MedicaRepository, PerfilRepository } from '@/domain/ports';
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

/**
 * Simula o servidor de denúncias. Os registros ficam só em memória: dado sensível não é
 * gravado no aparelho. Bloqueia o reenvio idêntico em sequência (duplo toque, rede lenta).
 */
export class LocalDenunciaRepository implements DenunciaRepository {
  private readonly registros: Denuncia[] = [];
  static readonly JANELA_DUPLICADA_MS = 2 * 60 * 1000;

  async registrar(nova: NovaDenuncia): Promise<ComprovanteDenuncia> {
    const agora = new Date();
    const repetida = this.registros.find(
      (d) =>
        d.medicaId === nova.medicaId &&
        d.tipo === nova.tipo &&
        d.motivo === nova.motivo &&
        agora.getTime() - new Date(d.criadoEm).getTime() < LocalDenunciaRepository.JANELA_DUPLICADA_MS,
    );
    if (repetida) {
      throw new Error(`Esta denúncia já foi registrada há instantes com o protocolo ${repetida.protocolo}.`);
    }

    let protocolo = gerarProtocolo(agora);
    while (this.registros.some((d) => d.protocolo === protocolo)) protocolo = gerarProtocolo(agora);

    const registro: Denuncia = {
      ...nova,
      // Mesmo que um cliente mande o identificador, denúncia anônima não guarda quem enviou.
      pacienteId: nova.anonima ? null : nova.pacienteId,
      id: `den-${agora.getTime().toString(36)}`,
      protocolo,
      status: 'ABERTA',
      criadoEm: agora.toISOString(),
      atualizadoEm: agora.toISOString(),
    };
    this.registros.push(registro);
    return atraso({ protocolo, criadoEm: registro.criadoEm });
  }
}

const CHAVE_ID = 'mutua:paciente-id:v1';

export class LocalPerfilRepository implements PerfilRepository {
  identificador(): string {
    let id = lerJson<string | null>(CHAVE_ID, null);
    if (!id) {
      id = `pac-${Math.random().toString(36).slice(2, 10)}`;
      gravarJson(CHAVE_ID, id);
    }
    return id;
  }

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
