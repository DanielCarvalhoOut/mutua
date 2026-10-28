import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { PerfilPaciente } from '@/domain/types';
import { useServicos } from './servicos';

/** Perfil usado no botão "Ver exemplo" da demonstração. */
export const PERFIL_EXEMPLO: PerfilPaciente = {
  idade: 52,
  mamografiaHaAnos: 4,
  preventivoHaAnos: 1,
  historicoFamiliarMama: false,
  vivencias: ['climaterio', 'maternidade'],
  especialidades: [],
  preferencias: ['teleconsulta', 'sus'],
};

interface PerfilContexto {
  perfil: PerfilPaciente | null;
  salvar(perfil: PerfilPaciente): void;
  atualizar(parcial: Partial<PerfilPaciente>): void;
  /** Médicas que não aparecem mais nas recomendações desta paciente. */
  ocultas: string[];
  ocultarMedica(id: string): void;
  limpar(): void;
}

const Contexto = createContext<PerfilContexto | null>(null);

export function PerfilProvider({ children }: { children: ReactNode }) {
  const { perfil: repo } = useServicos();
  const [perfil, setPerfil] = useState<PerfilPaciente | null>(() => repo.carregar());

  const salvar = useCallback(
    (p: PerfilPaciente) => {
      repo.salvar(p);
      setPerfil(p);
    },
    [repo],
  );
  const atualizar = useCallback(
    (parcial: Partial<PerfilPaciente>) => {
      setPerfil((atual) => {
        if (!atual) return atual;
        const novo = { ...atual, ...parcial };
        repo.salvar(novo);
        return novo;
      });
    },
    [repo],
  );
  const [ocultas, setOcultas] = useState<string[]>(() => repo.medicasOcultas());
  const ocultarMedica = useCallback(
    (id: string) => {
      repo.ocultarMedica(id);
      setOcultas(repo.medicasOcultas());
    },
    [repo],
  );

  const limpar = useCallback(() => {
    repo.limpar();
    setPerfil(null);
    setOcultas([]);
  }, [repo]);

  const valor = useMemo(
    () => ({ perfil, salvar, atualizar, ocultas, ocultarMedica, limpar }),
    [perfil, salvar, atualizar, ocultas, ocultarMedica, limpar],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function usePerfil(): PerfilContexto {
  const c = useContext(Contexto);
  if (!c) throw new Error('usePerfil precisa estar dentro de <PerfilProvider>');
  return c;
}
