import { describe, expect, it } from 'vitest';
import { MEDICAS, AVALIACOES } from '@/adapters/mock/seed';
import { avaliarMedica, buscarMedicas, notaAjustada, recomendar } from './matching';
import { priorizar, priorizarMamografia, priorizarPreventivo } from './prioridade';
import { afinidade } from './resumo';
import type { PerfilPaciente } from './types';

const perfil = (p: Partial<PerfilPaciente> = {}): PerfilPaciente => ({
  idade: 52,
  mamografiaHaAnos: 4,
  preventivoHaAnos: 1,
  historicoFamiliarMama: false,
  vivencias: [],
  especialidades: [],
  preferencias: [],
  ...p,
});

describe('recomendação', () => {
  it('devolve no máximo 5 médicas, ordenadas por afinidade', () => {
    const { recomendacoes } = recomendar(perfil({ vivencias: ['climaterio'] }), MEDICAS);
    expect(recomendacoes).toHaveLength(5);
    const scores = recomendacoes.map((r) => r.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('respeita a especialidade pedida', () => {
    const { recomendacoes } = recomendar(perfil({ especialidades: ['mastologia'] }), MEDICAS);
    expect(recomendacoes.every((r) => r.medica.especialidades.includes('mastologia'))).toBe(true);
  });

  it('aceita mais de uma especialidade ao mesmo tempo', () => {
    const pedidas = ['mastologia', 'endocrinologia'] as const;
    const { recomendacoes, totalAvaliadas } = recomendar(perfil({ especialidades: [...pedidas] }), MEDICAS);
    expect(totalAvaliadas).toBe(MEDICAS.filter((m) => m.especialidades.some((e) => pedidas.includes(e as never))).length);
    expect(recomendacoes.every((r) => r.medica.especialidades.some((e) => pedidas.includes(e as never)))).toBe(true);
    expect(new Set(recomendacoes.flatMap((r) => r.medica.especialidades)).size).toBeGreaterThan(1);
  });

  it('vivência não substitui competência: experiência e avaliações pesam mais', () => {
    const p = perfil({ vivencias: ['endometriose'], especialidades: ['ginecologia'] });
    const residente = avaliarMedica(p, MEDICAS.find((m) => m.id === 'fernanda-vilela')!);
    const especialista = avaliarMedica(p, MEDICAS.find((m) => m.id === 'camila-prado')!);
    // As duas compartilham a vivência; a mais qualificada e bem avaliada fica na frente.
    expect(residente.correspondenciaCompleta).toBe(true);
    expect(especialista.score).toBeGreaterThan(residente.score);
  });

  it('sinaliza quando nenhuma recomendada compartilha todas as vivências', () => {
    const r = recomendar(perfil({ vivencias: ['endometriose', 'cancer_mama'] }), MEDICAS);
    expect(r.algumaCompleta).toBe(false);
    expect(r.recomendacoes[0].destaques.length).toBeGreaterThan(0);
  });

  it('separa o que a médica tem do que falta', () => {
    const p = perfil({ vivencias: ['climaterio', 'sop'], preferencias: ['teleconsulta', 'sus'] });
    const r = avaliarMedica(p, MEDICAS.find((m) => m.id === 'helena-duarte')!);
    expect(r.vivenciasEmComum).toEqual(['climaterio']);
    expect(r.vivenciasFaltando).toEqual(['sop']);
    expect(r.preferenciasAtendidas).toEqual(['teleconsulta']);
    expect(r.preferenciasFaltando).toEqual(['sus']);
  });

  it('médica ocultada pela paciente não aparece mais', () => {
    const p = perfil({ vivencias: ['climaterio'] });
    const primeira = recomendar(p, MEDICAS).recomendacoes[0].medica.id;
    const depois = recomendar(p, MEDICAS, 5, [primeira]);
    expect(depois.recomendacoes.map((r) => r.medica.id)).not.toContain(primeira);
    expect(depois.totalAvaliadas).toBe(MEDICAS.length - 1);
  });

  it('nota ajustada puxa poucas avaliações para a média', () => {
    expect(notaAjustada(5, 1)).toBeLessThan(notaAjustada(5, 200));
  });
});

describe('busca de médicas', () => {
  it('encontra pelo nome, sem acento e sem diferenciar maiúsculas', () => {
    expect(buscarMedicas(perfil(), MEDICAS, 'silvia').map((r) => r.medica.id)).toEqual(['silvia-rocha']);
  });

  it('encontra por especialidade, bairro ou vivência, combinando palavras', () => {
    const res = buscarMedicas(perfil(), MEDICAS, 'mastologia marista');
    expect(res.map((r) => r.medica.id)).toEqual(['claudia-sena']);
    expect(buscarMedicas(perfil(), MEDICAS, 'endometriose').length).toBeGreaterThan(0);
  });

  it('vai além do top 5 e ignora o filtro de especialidade', () => {
    const p = perfil({ especialidades: ['mastologia'] });
    expect(buscarMedicas(p, MEDICAS, '')).toHaveLength(MEDICAS.length);
    expect(buscarMedicas(p, MEDICAS, 'camila')[0].medica.especialidades).toContain('ginecologia');
  });

  it('mantém a afinidade e não mostra médicas ocultadas', () => {
    const res = buscarMedicas(perfil(), MEDICAS, '', ['helena-duarte']);
    expect(res.some((r) => r.medica.id === 'helena-duarte')).toBe(false);
    const scores = res.map((r) => r.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it('sem resultado devolve lista vazia', () => {
    expect(buscarMedicas(perfil(), MEDICAS, 'xyz inexistente')).toEqual([]);
  });
});

describe('priorização de exames', () => {
  it('52 anos e mamografia há mais de 3 anos: prioridade alta', () => {
    const p = priorizarMamografia(perfil());
    expect(p?.nivel).toBe('alta');
    expect(p?.especialidadeSugerida).toBe('mastologia');
  });

  it('52 anos e mamografia há menos de 1 ano: em dia', () => {
    expect(priorizarMamografia(perfil({ mamografiaHaAnos: 0 }))?.nivel).toBe('em_dia');
  });

  it('35 anos com histórico familiar: conversar com mastologista', () => {
    expect(priorizarMamografia(perfil({ idade: 35, historicoFamiliarMama: true }))?.nivel).toBe('conversar');
  });

  it('35 anos sem histórico: sem alerta de mamografia', () => {
    expect(priorizarMamografia(perfil({ idade: 35 }))).toBeNull();
  });

  it('preventivo nunca feito aos 30 anos: prioridade alta', () => {
    expect(priorizarPreventivo(perfil({ idade: 30, preventivoHaAnos: null }))?.nivel).toBe('alta');
  });

  it('ordena da mais urgente para a em dia', () => {
    const lista = priorizar(perfil());
    expect(lista[0].nivel).toBe('alta');
  });
});

describe('afinidade', () => {
  it('calcula a nota entre mulheres com vivências parecidas', () => {
    const doHelena = AVALIACOES.filter((a) => a.medicaId === 'helena-duarte');
    const af = afinidade(doHelena, ['climaterio']);
    expect(af?.total).toBe(3);
    expect(af?.media).toBeCloseTo(14 / 3);
  });
});
