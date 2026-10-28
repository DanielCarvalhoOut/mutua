// Modelo de domínio da Mútua. Sem dependência de React, rede ou armazenamento:
// o mesmo código pode rodar no navegador hoje e num serviço de backend amanhã.

export type VivenciaId =
  | 'climaterio'
  | 'endometriose'
  | 'sop'
  | 'maternidade_atipica'
  | 'cancer_mama'
  | 'gestacao_risco'
  | 'infertilidade'
  | 'maternidade';

export type EspecialidadeId = 'ginecologia' | 'mastologia' | 'endocrinologia' | 'obstetricia';

export type PreferenciaId = 'teleconsulta' | 'plano' | 'sus' | 'acessibilidade' | 'libras';

/** Critérios que só mulheres avaliam e que costumam faltar em plataformas genéricas. */
export type CriterioId = 'respeito' | 'explicou' | 'consentimento' | 'acompanhante';

/**
 * Vivência de saúde declarada pela própria médica.
 * É dado pessoal sensível (LGPD, art. 11): só existe com consentimento explícito,
 * que a médica pode revogar a qualquer momento.
 */
export interface VivenciaDeclarada {
  id: VivenciaId;
  consentimentoEm: string; // ISO 8601
}

export interface RegistroProfissional {
  uf: string;
  crm: string;
  crmVerificado: boolean;
  /** Registro de Qualificação de Especialista (RQE), quando houver. */
  rqe: string | null;
}

export interface ResumoAvaliacoes {
  total: number;
  media: number; // 1..5
  /** Fração (0..1) das avaliações que marcaram cada critério como atendido. */
  criterios: Record<CriterioId, number>;
}

export interface Medica {
  id: string;
  nome: string;
  /** URL da foto enviada pela própria médica. Sem foto, a interface mostra as iniciais. */
  foto?: string;
  especialidades: EspecialidadeId[];
  registro: RegistroProfissional;
  formacao: string;
  anosExperiencia: number;
  bio: string;
  cidade: string;
  bairro: string;
  vivencias: VivenciaDeclarada[];
  atendimento: PreferenciaId[];
  avaliacoes: ResumoAvaliacoes;
}

export interface Avaliacao {
  id: string;
  medicaId: string;
  data: string; // ISO 8601
  nota: number; // 1..5
  texto: string;
  criterios: Partial<Record<CriterioId, boolean>>;
  autora: { faixaEtaria: string; vivencias: VivenciaId[] };
  consultaVerificada: boolean;
}

export type NovaAvaliacao = Omit<Avaliacao, 'id' | 'data'>;

/** Tempo desde o último exame, em anos. `null` = nunca fez. */
export type TempoDesdeExame = number | null;

export interface PerfilPaciente {
  idade: number | null;
  mamografiaHaAnos: TempoDesdeExame;
  preventivoHaAnos: TempoDesdeExame;
  historicoFamiliarMama: boolean;
  vivencias: VivenciaId[];
  /** Especialidades procuradas. Lista vazia = todas. */
  especialidades: EspecialidadeId[];
  preferencias: PreferenciaId[];
}
