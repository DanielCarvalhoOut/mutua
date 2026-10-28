// Leitura das avaliações: afinidade entre mulheres com vivências parecidas e o resumo em texto.

import { VIVENCIAS } from './catalogo';
import type { Avaliacao, Medica, PerfilPaciente, VivenciaId } from './types';

export interface Afinidade {
  vivencias: VivenciaId[];
  media: number;
  total: number;
}

/** Nota dada por mulheres que compartilham ao menos uma vivência com a paciente. */
export function afinidade(avaliacoes: Avaliacao[], vivencias: VivenciaId[]): Afinidade | null {
  if (!vivencias.length) return null;
  const alvo = new Set(vivencias);
  const parecidas = avaliacoes.filter((a) => a.autora.vivencias.some((v) => alvo.has(v)));
  if (parecidas.length < 2) return null;
  const emComum = [...new Set(parecidas.flatMap((a) => a.autora.vivencias.filter((v) => alvo.has(v))))];
  return {
    vivencias: emComum,
    media: parecidas.reduce((s, a) => s + a.nota, 0) / parecidas.length,
    total: parecidas.length,
  };
}

const nomeCurto = (m: Medica) => m.nome.split(' ').slice(0, 2).join(' ');
const pct = (v: number) => `${Math.round(v * 100)}%`;
const lista = (itens: string[]) =>
  itens.length <= 1 ? itens.join('') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;

/** Resumo por regras a partir dos números e das avaliações. Determinístico e explicável. */
export function resumirPorRegras(medica: Medica, avaliacoes: Avaliacao[], perfil: PerfilPaciente | null): string {
  const { criterios, total, media } = medica.avaliacoes;
  const frases: string[] = [];

  const fortes = (Object.entries(criterios) as [keyof typeof criterios, number][])
    .filter(([, v]) => v >= 0.9)
    .sort((a, b) => b[1] - a[1]);
  const textos: Record<string, string> = {
    respeito: 'se sentiram respeitadas',
    explicou: 'dizem que ela explica antes de examinar',
    consentimento: 'dizem que ela pede consentimento',
    acompanhante: 'tiveram o direito a acompanhante respeitado',
  };
  if (fortes.length) {
    const [chave, valor] = fortes[0];
    frases.push(`${pct(valor)} das pacientes ${textos[chave]}.`);
  }

  const fraco = (Object.entries(criterios) as [string, number][]).find(([, v]) => v < 0.75);
  if (fraco) frases.push(`Ponto de atenção: só ${pct(fraco[1])} ${textos[fraco[0]]}.`);

  const af = perfil ? afinidade(avaliacoes, perfil.vivencias) : null;
  if (af) {
    const nomes = lista(af.vivencias.map((v) => VIVENCIAS[v].toLowerCase()));
    frases.push(`Entre mulheres com ${nomes}, a nota é ${af.media.toFixed(1).replace('.', ',')}.`);
  }

  const vivencias = medica.vivencias.map((v) => VIVENCIAS[v.id].toLowerCase());
  if (vivencias.length) frases.push(`${nomeCurto(medica)} declarou vivência com ${lista(vivencias)}.`);

  if (!frases.length) {
    frases.push(`Nota ${media.toFixed(1).replace('.', ',')} em ${total} avaliações.`);
  }
  return frases.join(' ');
}
