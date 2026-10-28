import { useEffect, type ReactNode } from 'react';
import { HashRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { BoasVindas } from '@/features/boas-vindas/BoasVindas';
import { Cadastro } from '@/features/cadastro/Cadastro';
import { NovaAvaliacao } from '@/features/avaliacao/NovaAvaliacao';
import { PerfilMedica } from '@/features/medica/PerfilMedica';
import { MeuPerfil } from '@/features/perfil/MeuPerfil';
import { Recomendacoes } from '@/features/recomendacoes/Recomendacoes';
import { Icone } from '@/shared/ui/Icone';
import { PerfilProvider, usePerfil } from './perfil';

// HashRouter: o build é estático e funciona em qualquer CDN, sem regra de reescrita no servidor.
export function App() {
  return (
    <HashRouter>
      <PerfilProvider>
        <RolarParaTopo />
        <div className="app">
          <Routes>
            <Route path="/" element={<BoasVindas />} />
            <Route path="/comecar" element={<Cadastro />} />
            <Route element={<ComNavegacao />}>
              <Route path="/recomendacoes" element={<ExigePerfil><Recomendacoes /></ExigePerfil>} />
              <Route path="/perfil" element={<MeuPerfil />} />
            </Route>
            <Route path="/medica/:id" element={<PerfilMedica />} />
            <Route path="/medica/:id/avaliar" element={<NovaAvaliacao />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </PerfilProvider>
    </HashRouter>
  );
}

function ComNavegacao() {
  return (
    <>
      <Outlet />
      <nav className="nav" aria-label="Principal">
        <NavLink to="/recomendacoes">
          <Icone nome="inicio" />
          Minhas médicas
        </NavLink>
        <NavLink to="/perfil">
          <Icone nome="pessoa" />
          Meu perfil
        </NavLink>
      </nav>
    </>
  );
}

function ExigePerfil({ children }: { children: ReactNode }) {
  const { perfil } = usePerfil();
  return perfil ? <>{children}</> : <Navigate to="/" replace />;
}

function RolarParaTopo() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
