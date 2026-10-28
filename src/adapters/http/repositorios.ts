// Adaptador para o backend REST (implementação futura do servidor).
// Contrato esperado:
//   GET  {api}/medicas?especialidade=ginecologia   -> Medica[]
//   GET  {api}/medicas/{id}                         -> Medica | 404
//   GET  {api}/medicas/{id}/avaliacoes              -> Avaliacao[]
//   POST {api}/avaliacoes                           -> Avaliacao (append-only)
//   POST {api}/denuncias                            -> ComprovanteDenuncia (paciente autenticada)
//   GET/PATCH de denúncias existem só no painel administrativo, nunca neste app.

import type { ComprovanteDenuncia, NovaDenuncia } from '@/domain/denuncia';
import type { AvaliacaoRepository, DenunciaRepository, MedicaRepository } from '@/domain/ports';
import type { Avaliacao, EspecialidadeId, Medica, NovaAvaliacao } from '@/domain/types';

async function requisitar<T>(url: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!resposta.ok) throw new Error(`Falha ao acessar ${url}: ${resposta.status}`);
  return resposta.json() as Promise<T>;
}

export class HttpMedicaRepository implements MedicaRepository {
  constructor(private readonly api: string) {}

  listar(filtro?: { especialidade?: EspecialidadeId }): Promise<Medica[]> {
    const qs = filtro?.especialidade ? `?especialidade=${encodeURIComponent(filtro.especialidade)}` : '';
    return requisitar<Medica[]>(`${this.api}/medicas${qs}`);
  }

  async buscarPorId(id: string): Promise<Medica | null> {
    try {
      return await requisitar<Medica>(`${this.api}/medicas/${encodeURIComponent(id)}`);
    } catch {
      return null;
    }
  }
}

export class HttpDenunciaRepository implements DenunciaRepository {
  constructor(private readonly api: string) {}

  async registrar(nova: NovaDenuncia): Promise<ComprovanteDenuncia> {
    // O erro mostrado à paciente é genérico: nada do conteúdo da denúncia vai para mensagens ou logs.
    try {
      return await requisitar<ComprovanteDenuncia>(`${this.api}/denuncias`, { method: 'POST', body: JSON.stringify(nova) });
    } catch {
      throw new Error('Não conseguimos registrar a denúncia agora. Seus dados continuam aqui; tente de novo em instantes.');
    }
  }
}

export class HttpAvaliacaoRepository implements AvaliacaoRepository {
  constructor(private readonly api: string) {}

  listarPorMedica(medicaId: string): Promise<Avaliacao[]> {
    return requisitar<Avaliacao[]>(`${this.api}/medicas/${encodeURIComponent(medicaId)}/avaliacoes`);
  }

  registrar(nova: NovaAvaliacao): Promise<Avaliacao> {
    return requisitar<Avaliacao>(`${this.api}/avaliacoes`, { method: 'POST', body: JSON.stringify(nova) });
  }
}
