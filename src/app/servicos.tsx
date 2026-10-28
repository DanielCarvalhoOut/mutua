// Composição: escolhe os adaptadores conforme a configuração e os entrega às telas.
// Para ligar o backend, basta VITE_DATA_SOURCE=api e VITE_API_URL.

import { createContext, useContext, type ReactNode } from 'react';
import { HttpAvaliacaoRepository, HttpMedicaRepository } from '@/adapters/http/repositorios';
import { LocalAvaliacaoRepository, LocalPerfilRepository, MockMedicaRepository } from '@/adapters/mock/repositorios';
import { RegrasResumoProvider } from '@/adapters/resumo/regras';
import type { AvaliacaoRepository, MedicaRepository, PerfilRepository, ResumoProvider } from '@/domain/ports';

export interface Servicos {
  medicas: MedicaRepository;
  avaliacoes: AvaliacaoRepository;
  perfil: PerfilRepository;
  resumo: ResumoProvider;
}

export function criarServicos(env: ImportMetaEnv = import.meta.env): Servicos {
  const perfil = new LocalPerfilRepository();
  const resumo = new RegrasResumoProvider();

  if (env.VITE_DATA_SOURCE === 'api' && env.VITE_API_URL) {
    return {
      medicas: new HttpMedicaRepository(env.VITE_API_URL),
      avaliacoes: new HttpAvaliacaoRepository(env.VITE_API_URL),
      perfil,
      resumo,
    };
  }

  const avaliacoes = new LocalAvaliacaoRepository();
  return { medicas: new MockMedicaRepository(avaliacoes), avaliacoes, perfil, resumo };
}

const ServicosContext = createContext<Servicos | null>(null);

export function ServicosProvider({ servicos, children }: { servicos: Servicos; children: ReactNode }) {
  return <ServicosContext.Provider value={servicos}>{children}</ServicosContext.Provider>;
}

export function useServicos(): Servicos {
  const s = useContext(ServicosContext);
  if (!s) throw new Error('useServicos precisa estar dentro de <ServicosProvider>');
  return s;
}
