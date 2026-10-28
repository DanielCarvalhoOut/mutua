import type { CriterioId, EspecialidadeId, PreferenciaId, VivenciaId } from './types';

export const VIVENCIAS: Record<VivenciaId, string> = {
  climaterio: 'Climatério e menopausa',
  endometriose: 'Endometriose',
  sop: 'SOP',
  maternidade_atipica: 'Maternidade atípica',
  cancer_mama: 'Câncer de mama',
  gestacao_risco: 'Gestação de risco',
  infertilidade: 'Infertilidade',
  maternidade: 'Maternidade',
};

export const ESPECIALIDADES: Record<EspecialidadeId, string> = {
  ginecologia: 'Ginecologia',
  mastologia: 'Mastologia',
  endocrinologia: 'Endocrinologia',
  obstetricia: 'Obstetrícia',
};

export const PREFERENCIAS: Record<PreferenciaId, string> = {
  teleconsulta: 'Teleconsulta',
  plano: 'Aceita plano de saúde',
  sus: 'Atende pelo SUS',
  acessibilidade: 'Consultório acessível',
  libras: 'Atende em Libras',
};

export const CRITERIOS: Record<CriterioId, string> = {
  respeito: 'Me senti respeitada',
  explicou: 'Explicou antes de examinar',
  consentimento: 'Pediu meu consentimento',
  acompanhante: 'Respeitou meu direito a acompanhante',
};

export const listar = <K extends string>(mapa: Record<K, string>) =>
  (Object.keys(mapa) as K[]).map((id) => ({ id, rotulo: mapa[id] }));
