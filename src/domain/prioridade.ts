// Priorização de exames pela idade e pelo histórico da paciente.
// Orientação geral baseada nas diretrizes públicas brasileiras; não substitui avaliação médica.

import type { EspecialidadeId, PerfilPaciente } from './types';

export type NivelPrioridade = 'alta' | 'media' | 'conversar' | 'em_dia';

export interface Prioridade {
  exame: 'mamografia' | 'preventivo';
  nivel: NivelPrioridade;
  titulo: string;
  motivo: string;
  especialidadeSugerida: EspecialidadeId;
  referencia: string;
}

const ORDEM: Record<NivelPrioridade, number> = { alta: 0, media: 1, conversar: 2, em_dia: 3 };

const REF_MAMO = 'Ministério da Saúde/INCA e Lei 11.664/2008';
const REF_PREV = 'INCA: Diretrizes para o rastreamento do câncer do colo do útero';

function descreverTempo(haAnos: number | null): string {
  if (haAnos === null) return 'você ainda não fez esse exame';
  if (haAnos === 0) return 'seu último exame foi há menos de 1 ano';
  if (haAnos >= 4) return 'seu último exame foi há mais de 3 anos';
  return `seu último exame foi há ${haAnos} a ${haAnos + 1} anos`;
}

export function priorizarMamografia(p: PerfilPaciente): Prioridade | null {
  const { idade, mamografiaHaAnos: t, historicoFamiliarMama: familia } = p;
  if (idade === null) return null;
  const base = { exame: 'mamografia' as const, especialidadeSugerida: 'mastologia' as const, referencia: REF_MAMO };

  if (idade < 40) {
    if (!familia) return null;
    return {
      ...base,
      nivel: 'conversar',
      titulo: 'Avaliação de risco para câncer de mama',
      motivo: 'Com caso de câncer de mama na família, a investigação pode começar antes dos 40 anos. Uma mastologista avalia o seu risco.',
    };
  }

  if (idade < 50) {
    if (familia && (t === null || t >= 1)) {
      return {
        ...base,
        nivel: 'alta',
        titulo: 'Mamografia',
        motivo: `Você tem ${idade} anos, histórico familiar e ${descreverTempo(t)}. Com histórico na família, o acompanhamento costuma ser anual.`,
      };
    }
    if (t === null || t >= 2) {
      return {
        ...base,
        nivel: 'media',
        titulo: 'Mamografia',
        motivo: `Você tem ${idade} anos e ${descreverTempo(t)}. A lei garante a mamografia pelo SUS a partir dos 40; defina a frequência com sua médica.`,
      };
    }
    return { ...base, nivel: 'em_dia', titulo: 'Mamografia', motivo: `Você tem ${idade} anos e ${descreverTempo(t)}.` };
  }

  if (idade <= 74) {
    if (t === null || t >= 2) {
      return {
        ...base,
        nivel: 'alta',
        titulo: 'Mamografia',
        motivo: `Você tem ${idade} anos e ${descreverTempo(t)}. Nessa idade, a recomendação é a cada 2 anos.`,
      };
    }
    return {
      ...base,
      nivel: 'em_dia',
      titulo: 'Mamografia',
      motivo: `Você tem ${idade} anos e ${descreverTempo(t)}. A próxima vence em até ${t === 0 ? '2 anos' : '1 ano'}.`,
    };
  }

  return {
    ...base,
    nivel: 'conversar',
    titulo: 'Mamografia',
    motivo: `Depois dos 74 anos, a decisão de continuar o rastreamento é individual. Converse com sua médica.`,
  };
}

export function priorizarPreventivo(p: PerfilPaciente): Prioridade | null {
  const { idade, preventivoHaAnos: t } = p;
  if (idade === null || idade < 25 || idade > 64) return null;
  const base = {
    exame: 'preventivo' as const,
    titulo: 'Preventivo (Papanicolau)',
    especialidadeSugerida: 'ginecologia' as const,
    referencia: REF_PREV,
  };
  if (t === null || t >= 4) {
    return {
      ...base,
      nivel: 'alta',
      motivo: `Você tem ${idade} anos e ${descreverTempo(t)}. Dos 25 aos 64 anos, o exame é feito a cada 3 anos depois de dois resultados normais.`,
    };
  }
  if (t >= 2) {
    return { ...base, nivel: 'media', motivo: `${descreverTempo(t).replace(/^s/, 'S')}. Ele vence em breve.` };
  }
  return { ...base, nivel: 'em_dia', motivo: `${descreverTempo(t).replace(/^s/, 'S')}.` };
}

export function priorizar(perfil: PerfilPaciente): Prioridade[] {
  return [priorizarMamografia(perfil), priorizarPreventivo(perfil)]
    .filter((x): x is Prioridade => x !== null)
    .sort((a, b) => ORDEM[a.nivel] - ORDEM[b.nivel]);
}
