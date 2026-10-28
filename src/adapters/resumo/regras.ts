import type { ResumoProvider } from '@/domain/ports';
import { resumirPorRegras } from '@/domain/resumo';

/** Resumo gerado por regras sobre as avaliações. Pode ser trocado por um provedor com modelo de linguagem. */
export class RegrasResumoProvider implements ResumoProvider {
  async resumir({ medica, avaliacoes, perfil }: Parameters<ResumoProvider['resumir']>[0]) {
    return resumirPorRegras(medica, avaliacoes, perfil);
  }
}
