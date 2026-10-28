// Denúncia de médica em caso de abuso. Regras puras: validação, montagem e protocolo.
// As regras de acesso (só o perfil administrativo lista; a médica nunca vê) ficam no servidor.

export type TipoOcorrencia =
  | 'assedio_moral'
  | 'assedio_sexual'
  | 'conduta_antietica'
  | 'negligencia'
  | 'desrespeito'
  | 'outro';

export const TIPOS_OCORRENCIA: Record<TipoOcorrencia, string> = {
  assedio_moral: 'Assédio moral',
  assedio_sexual: 'Assédio sexual',
  conduta_antietica: 'Conduta antiética',
  negligencia: 'Negligência',
  desrespeito: 'Desrespeito ou discriminação',
  outro: 'Outro',
};

export type StatusDenuncia = 'ABERTA' | 'EM_ANALISE' | 'CONCLUIDA';

export const MOTIVO_MINIMO = 20;
export const MOTIVO_MAXIMO = 3000;

/** O que a paciente preenche. Campos vazios ainda não foram respondidos. */
export interface RascunhoDenuncia {
  medicaId: string;
  /** Data e hora local no formato do campo datetime-local (AAAA-MM-DDTHH:MM). */
  ocorridoEm: string;
  tipo: TipoOcorrencia | '';
  motivo: string;
  anonima: boolean | null;
}

/** O que sai do aparelho. Em denúncia anônima, `pacienteId` é sempre null. */
export interface NovaDenuncia {
  medicaId: string;
  ocorridoEm: string; // ISO 8601
  tipo: TipoOcorrencia;
  motivo: string;
  anonima: boolean;
  pacienteId: string | null;
}

/** Registro completo, como o servidor guarda. A paciente nunca recebe isso de volta. */
export interface Denuncia extends NovaDenuncia {
  id: string;
  protocolo: string;
  status: StatusDenuncia;
  criadoEm: string;
  atualizadoEm: string;
}

/** Única resposta que a paciente recebe: o comprovante. */
export interface ComprovanteDenuncia {
  protocolo: string;
  criadoEm: string;
}

export type ErrosDenuncia = Partial<Record<keyof RascunhoDenuncia, string>>;

export function rascunhoVazio(medicaId = ''): RascunhoDenuncia {
  return { medicaId, ocorridoEm: '', tipo: '', motivo: '', anonima: null };
}

export function validarDenuncia(r: RascunhoDenuncia, agora: Date = new Date()): ErrosDenuncia {
  const erros: ErrosDenuncia = {};
  if (!r.medicaId) erros.medicaId = 'Escolha a médica.';

  const data = r.ocorridoEm ? new Date(r.ocorridoEm) : null;
  if (!data || Number.isNaN(data.getTime())) erros.ocorridoEm = 'Informe quando aconteceu.';
  else if (data.getTime() > agora.getTime()) erros.ocorridoEm = 'A data não pode estar no futuro.';

  if (!r.tipo) erros.tipo = 'Escolha o tipo de ocorrência.';

  const motivo = r.motivo.trim();
  if (motivo.length < MOTIVO_MINIMO) erros.motivo = `Escreva pelo menos ${MOTIVO_MINIMO} caracteres.`;
  else if (motivo.length > MOTIVO_MAXIMO) erros.motivo = `Use no máximo ${MOTIVO_MAXIMO} caracteres.`;

  if (r.anonima === null) erros.anonima = 'Diga se a denúncia deve ser anônima.';
  return erros;
}

export const denunciaValida = (r: RascunhoDenuncia, agora?: Date) => Object.keys(validarDenuncia(r, agora)).length === 0;

/**
 * Monta o que vai para o servidor. Se for anônima, o identificador da paciente é
 * descartado aqui mesmo: ele nunca sai do aparelho, em vez de só ficar escondido na tela.
 */
export function montarDenuncia(r: RascunhoDenuncia, pacienteId: string | null): NovaDenuncia {
  if (!denunciaValida(r)) throw new Error('Denúncia incompleta.');
  return {
    medicaId: r.medicaId,
    ocorridoEm: new Date(r.ocorridoEm).toISOString(),
    tipo: r.tipo as TipoOcorrencia,
    motivo: r.motivo.trim(),
    anonima: r.anonima === true,
    pacienteId: r.anonima ? null : pacienteId,
  };
}

// Sem 0/O e 1/I, para o protocolo ser ditado por telefone sem confusão.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Protocolo no formato DEN-AAAAMMDD-XXXX. No servidor, a unicidade é garantida pelo banco. */
export function gerarProtocolo(data: Date = new Date(), aleatorio: () => number = Math.random): string {
  const dia = `${data.getFullYear()}${String(data.getMonth() + 1).padStart(2, '0')}${String(data.getDate()).padStart(2, '0')}`;
  let sufixo = '';
  for (let i = 0; i < 4; i++) sufixo += ALFABETO[Math.floor(aleatorio() * ALFABETO.length)];
  return `DEN-${dia}-${sufixo}`;
}

/** Valor para o atributo `max` do campo datetime-local: agora, no fuso do aparelho. */
export function agoraLocal(agora: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}T${p(agora.getHours())}:${p(agora.getMinutes())}`;
}
