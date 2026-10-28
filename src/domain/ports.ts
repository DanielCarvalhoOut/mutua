// Portas (interfaces) que a interface usa. Cada fonte de dados é um adaptador que as
// implementa: hoje `adapters/mock`, amanhã `adapters/http` (backend próprio) e os
// conectores de `integrations/` (CNES, CFM, operadoras). Trocar a fonte não muda as telas.

import type { ComprovanteDenuncia, NovaDenuncia } from './denuncia';
import type { Avaliacao, EspecialidadeId, Medica, NovaAvaliacao, PerfilPaciente } from './types';

export interface MedicaRepository {
  listar(filtro?: { especialidade?: EspecialidadeId }): Promise<Medica[]>;
  buscarPorId(id: string): Promise<Medica | null>;
}

/**
 * Repositório só de inclusão: não existe método para editar ou apagar avaliação.
 * A médica não altera nem remove o que foi escrito. Remoção só acontece pela
 * moderação (violação dos termos ou ordem judicial), num fluxo separado e auditado.
 */
export interface AvaliacaoRepository {
  listarPorMedica(medicaId: string): Promise<Avaliacao[]>;
  registrar(nova: NovaAvaliacao): Promise<Avaliacao>;
}

/**
 * Canal de denúncias. Do lado da paciente só existe envio, e a resposta é só o comprovante.
 * Listar, ver detalhes e mudar status são exclusivos do perfil administrativo, no servidor;
 * a médica denunciada nunca vê nem é notificada.
 */
export interface DenunciaRepository {
  registrar(nova: NovaDenuncia): Promise<ComprovanteDenuncia>;
}

export interface PerfilRepository {
  /** Identificador da paciente nesta sessão (no backend, vem da autenticação). */
  identificador(): string;
  carregar(): PerfilPaciente | null;
  salvar(perfil: PerfilPaciente): void;
  /** Médicas que a paciente não quer mais ver nas recomendações (ex.: após uma denúncia). */
  medicasOcultas(): string[];
  ocultarMedica(id: string): void;
  limpar(): void;
}

/** Gera o texto de resumo das avaliações. Hoje por regras; pode virar um modelo de linguagem. */
export interface ResumoProvider {
  resumir(entrada: { medica: Medica; avaliacoes: Avaliacao[]; perfil: PerfilPaciente | null }): Promise<string>;
}
