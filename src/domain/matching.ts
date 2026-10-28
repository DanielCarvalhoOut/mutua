// Motor de recomendação. Função pura: recebe perfil e médicas, devolve o ranking explicado.
//
// Princípio do produto: vivência não substitui competência. O peso maior fica com a
// qualificação e com as avaliações; a vivência em comum aproxima e desempata.

import { PREFERENCIAS, VIVENCIAS } from './catalogo';
import type { Medica, PerfilPaciente, PreferenciaId, VivenciaId } from './types';

export const PESOS = {
  qualificacao: 0.35,
  avaliacoes: 0.3,
  vivencias: 0.25,
  preferencias: 0.1,
} as const;

export type Componente = keyof typeof PESOS;

export interface Recomendacao {
  medica: Medica;
  /** Afinidade de 0 a 100. */
  score: number;
  /** Nota de 0 a 1 de cada componente que entrou na conta. */
  componentes: Partial<Record<Componente, number>>;
  vivenciasEmComum: VivenciaId[];
  vivenciasFaltando: VivenciaId[];
  preferenciasAtendidas: PreferenciaId[];
  preferenciasFaltando: PreferenciaId[];
  /** Compartilha todas as vivências que a paciente marcou. */
  correspondenciaCompleta: boolean;
  /** Pontos fortes objetivos, usados quando a vivência não bate 100%. */
  destaques: string[];
}

export interface ResultadoRecomendacao {
  recomendacoes: Recomendacao[];
  /** Pelo menos uma das recomendadas compartilha todas as vivências da paciente. */
  algumaCompleta: boolean;
  totalAvaliadas: number;
}

const limitar = (v: number) => Math.max(0, Math.min(1, v));

/** Média bayesiana: poucas avaliações puxam a nota para a média geral da plataforma. */
export function notaAjustada(media: number, total: number, prior = 4.0, peso = 10): number {
  return (prior * peso + media * total) / (peso + total);
}

export function pontuarQualificacao(medica: Medica): number {
  const especialista = medica.registro.rqe ? 1 : 0.6;
  const experiencia = limitar(medica.anosExperiencia / 15);
  return 0.5 * especialista + 0.5 * experiencia;
}

export function pontuarAvaliacoes(medica: Medica): number {
  const { media, total, criterios } = medica.avaliacoes;
  const nota = limitar((notaAjustada(media, total) - 3) / 2);
  const valores = Object.values(criterios);
  const criteriosMedia = valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : 0;
  return 0.6 * nota + 0.4 * criteriosMedia;
}

const percentual = (v: number) => `${Math.round(v * 100)}%`;
const decimal = (v: number) => v.toFixed(1).replace('.', ',');

export function destacar(medica: Medica): string[] {
  const d: string[] = [];
  const { media, total, criterios } = medica.avaliacoes;
  if (total >= 20 && media >= 4.6) d.push(`Nota ${decimal(media)} em ${total} avaliações de mulheres`);
  if (criterios.respeito >= 0.9) d.push(`${percentual(criterios.respeito)} se sentiram respeitadas`);
  if (medica.anosExperiencia >= 10) d.push(`${medica.anosExperiencia} anos de experiência`);
  if (medica.registro.rqe) d.push('Especialista com RQE');
  return d;
}

export function avaliarMedica(perfil: PerfilPaciente, medica: Medica): Recomendacao {
  const vivenciasMedica = new Set(medica.vivencias.map((v) => v.id));
  const vivenciasEmComum = perfil.vivencias.filter((v) => vivenciasMedica.has(v));
  const vivenciasFaltando = perfil.vivencias.filter((v) => !vivenciasMedica.has(v));
  const preferenciasAtendidas = perfil.preferencias.filter((p) => medica.atendimento.includes(p));
  const preferenciasFaltando = perfil.preferencias.filter((p) => !medica.atendimento.includes(p));

  const componentes: Partial<Record<Componente, number>> = {
    qualificacao: pontuarQualificacao(medica),
    avaliacoes: pontuarAvaliacoes(medica),
  };
  // Componentes sem pedido da paciente saem da conta e o peso se redistribui.
  if (perfil.vivencias.length) componentes.vivencias = vivenciasEmComum.length / perfil.vivencias.length;
  if (perfil.preferencias.length) {
    componentes.preferencias = preferenciasAtendidas.length / perfil.preferencias.length;
  }

  let soma = 0;
  let pesos = 0;
  for (const [chave, valor] of Object.entries(componentes) as [Componente, number][]) {
    soma += PESOS[chave] * valor;
    pesos += PESOS[chave];
  }

  return {
    medica,
    score: Math.round((soma / pesos) * 100),
    componentes,
    vivenciasEmComum,
    vivenciasFaltando,
    preferenciasAtendidas,
    preferenciasFaltando,
    correspondenciaCompleta: perfil.vivencias.length > 0 && vivenciasFaltando.length === 0,
    destaques: destacar(medica),
  };
}

export function recomendar(
  perfil: PerfilPaciente,
  medicas: Medica[],
  limite = 5,
  /** Médicas que a paciente pediu para não ver mais (ex.: depois de uma denúncia). */
  ocultas: string[] = [],
): ResultadoRecomendacao {
  const elegiveis = medicas.filter(
    (m) =>
      m.registro.crmVerificado &&
      !ocultas.includes(m.id) &&
      (perfil.especialidades.length === 0 || m.especialidades.some((e) => perfil.especialidades.includes(e))),
  );
  const ranking = elegiveis
    .map((m) => avaliarMedica(perfil, m))
    .sort((a, b) => b.score - a.score || b.medica.avaliacoes.total - a.medica.avaliacoes.total)
    .slice(0, limite);

  return {
    recomendacoes: ranking,
    algumaCompleta: ranking.some((r) => r.correspondenciaCompleta),
    totalAvaliadas: elegiveis.length,
  };
}

/** Itens "tem / não tem" na ordem em que a tela mostra. */
export function itensDeCorrespondencia(r: Recomendacao) {
  return [
    ...r.vivenciasEmComum.map((v) => ({ rotulo: VIVENCIAS[v], tem: true, tipo: 'vivencia' as const })),
    ...r.preferenciasAtendidas.map((p) => ({ rotulo: PREFERENCIAS[p], tem: true, tipo: 'preferencia' as const })),
    ...r.vivenciasFaltando.map((v) => ({ rotulo: VIVENCIAS[v], tem: false, tipo: 'vivencia' as const })),
    ...r.preferenciasFaltando.map((p) => ({ rotulo: PREFERENCIAS[p], tem: false, tipo: 'preferencia' as const })),
  ];
}
