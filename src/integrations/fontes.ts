// Integrações planejadas (implementação futura). Cada fonte externa vira um adaptador que
// alimenta as portas de `domain/ports.ts`; nenhuma tela precisa mudar quando entrarem.
//
// Públicas
//  - CNES (DataSUS): estabelecimentos e profissionais vinculados, para localizar quem atende pelo SUS.
//  - CFM (Busca Médico): validação de CRM e RQE, que alimenta `crmVerificado` e `rqe`.
//  - Regulação do SUS (SISREG/centrais estaduais): encaminhamento qualificado com as preferências da paciente.
// Privadas
//  - Operadoras de plano de saúde: rede credenciada e agenda.
//  - Clínicas e consultórios parceiros: agenda e confirmação de consulta (base da "consulta verificada").

import type { EspecialidadeId, RegistroProfissional } from '@/domain/types';

export interface ValidadorRegistro {
  validar(uf: string, crm: string): Promise<RegistroProfissional>;
}

export interface FonteRedeAtendimento {
  /** Ex.: 'cnes', 'operadora:<id>', 'clinica:<id>' */
  readonly origem: string;
  profissionais(filtro: { uf: string; municipio?: string; especialidade?: EspecialidadeId }): Promise<
    { crm: string; uf: string; nome: string; atendimento: ('sus' | 'plano')[] }[]
  >;
}

export interface AgendaParceira {
  horariosLivres(medicaId: string, de: Date, ate: Date): Promise<Date[]>;
  /** Devolve o código que depois comprova a consulta na avaliação. */
  reservar(medicaId: string, horario: Date): Promise<{ codigoConsulta: string }>;
}
