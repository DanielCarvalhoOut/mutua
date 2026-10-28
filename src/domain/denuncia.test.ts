import { describe, expect, it } from 'vitest';
import { LocalDenunciaRepository } from '@/adapters/mock/repositorios';
import {
  gerarProtocolo,
  montarDenuncia,
  MOTIVO_MINIMO,
  podeConfirmar,
  rascunhoVazio,
  validarDenuncia,
  type RascunhoDenuncia,
} from './denuncia';

const AGORA = new Date('2026-10-28T15:00:00');

const valido = (p: Partial<RascunhoDenuncia> = {}): RascunhoDenuncia => ({
  medicaId: 'helena-duarte',
  ocorridoEm: '2026-10-20T10:30',
  tipo: 'desrespeito',
  motivo: 'Ela começou o exame sem explicar e sem pedir permissão.',
  anonima: true,
  autorizaCrm: false,
  ...p,
});

describe('validação da denúncia', () => {
  it('aceita uma denúncia completa', () => {
    expect(validarDenuncia(valido(), AGORA)).toEqual({});
  });

  it('exige todos os campos de um rascunho vazio', () => {
    expect(Object.keys(validarDenuncia(rascunhoVazio(), AGORA)).sort()).toEqual(
      ['anonima', 'medicaId', 'motivo', 'ocorridoEm', 'tipo'].sort(),
    );
  });

  it('recusa data no futuro', () => {
    expect(validarDenuncia(valido({ ocorridoEm: '2026-10-29T09:00' }), AGORA).ocorridoEm).toMatch(/futuro/);
  });

  it(`exige motivo com pelo menos ${MOTIVO_MINIMO} caracteres, sem contar espaços nas pontas`, () => {
    expect(validarDenuncia(valido({ motivo: '   curto demais   ' }), AGORA).motivo).toBeDefined();
    expect(validarDenuncia(valido({ motivo: 'x'.repeat(MOTIVO_MINIMO) }), AGORA).motivo).toBeUndefined();
  });

  it('exige escolher se é anônima', () => {
    expect(validarDenuncia(valido({ anonima: null }), AGORA).anonima).toBeDefined();
  });
});

describe('anonimato', () => {
  it('denúncia anônima nunca leva o identificador da paciente', () => {
    expect(montarDenuncia(valido({ anonima: true }), 'pac-123', 'GO').pacienteId).toBeNull();
  });

  it('denúncia identificada leva o identificador', () => {
    expect(montarDenuncia(valido({ anonima: false }), 'pac-123', 'GO').pacienteId).toBe('pac-123');
  });

  it('não monta denúncia inválida', () => {
    expect(() => montarDenuncia(valido({ motivo: '' }), 'pac-123', 'GO')).toThrow();
  });
});

describe('encaminhamento ao CRM', () => {
  it('toda denúncia vai para o CRM do estado da médica', () => {
    expect(montarDenuncia(valido(), 'pac-123', 'GO').encaminhamento).toMatchObject({ orgao: 'CRM', uf: 'GO' });
  });

  it('anônima nunca compartilha identificação com o CRM, mesmo marcada', () => {
    const e = montarDenuncia(valido({ anonima: true, autorizaCrm: true }), 'pac-123', 'GO').encaminhamento;
    expect(e.compartilharIdentificacao).toBe(false);
  });

  it('identificada só compartilha com autorização', () => {
    const sem = montarDenuncia(valido({ anonima: false }), 'pac-123', 'GO');
    const com = montarDenuncia(valido({ anonima: false, autorizaCrm: true }), 'pac-123', 'GO');
    expect(sem.encaminhamento.compartilharIdentificacao).toBe(false);
    expect(com.encaminhamento.compartilharIdentificacao).toBe(true);
  });

  it('identificada exige autorizar o CRM para confirmar; anônima não', () => {
    expect(podeConfirmar(valido({ anonima: false }), true)).toBe(false);
    expect(podeConfirmar(valido({ anonima: false, autorizaCrm: true }), true)).toBe(true);
    expect(podeConfirmar(valido({ anonima: true }), true)).toBe(true);
    expect(podeConfirmar(valido({ anonima: true }), false)).toBe(false);
  });
});

describe('protocolo', () => {
  it('segue o formato DEN-AAAAMMDD-XXXX sem caracteres ambíguos', () => {
    const p = gerarProtocolo(AGORA);
    expect(p).toMatch(/^DEN-20261028-[A-HJ-NP-Z2-9]{4}$/);
  });
});

describe('canal de denúncias (simulado)', () => {
  it('devolve só o comprovante, sem o conteúdo da denúncia', async () => {
    const repo = new LocalDenunciaRepository();
    const recibo = await repo.registrar(montarDenuncia(valido(), 'pac-123', 'GO'));
    expect(Object.keys(recibo).sort()).toEqual(['conselho', 'criadoEm', 'protocolo']);
    expect(recibo.conselho).toBe('CRM-GO');
  });

  it('bloqueia o reenvio idêntico em sequência', async () => {
    const repo = new LocalDenunciaRepository();
    const nova = montarDenuncia(valido(), 'pac-123', 'GO');
    await repo.registrar(nova);
    await expect(repo.registrar(nova)).rejects.toThrow(/já foi registrada/);
  });

  it('não oferece nenhuma forma de listar denúncias no app da paciente', () => {
    const repo = new LocalDenunciaRepository() as unknown as Record<string, unknown>;
    expect(repo.listar).toBeUndefined();
    expect(repo.buscarPorId).toBeUndefined();
  });
});
