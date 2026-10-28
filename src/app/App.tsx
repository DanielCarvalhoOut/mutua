import { useEffect, type ReactNode } from 'react';
import { HashRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigationType } from 'react-router-dom';
import { BoasVindas } from '@/features/boas-vindas/BoasVindas';
import { Cadastro } from '@/features/cadastro/Cadastro';
import { NovaAvaliacao } from '@/features/avaliacao/NovaAvaliacao';
import { Denuncia } from '@/features/denuncia/Denuncia';
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
            <Route path="/" element={<Animada><BoasVindas /></Animada>} />
            <Route path="/comecar" element={<Animada><Cadastro /></Animada>} />
            <Route element={<ComNavegacao />}>
              <Route path="/recomendacoes" element={<Animada><ExigePerfil><Recomendacoes /></ExigePerfil></Animada>} />
              <Route path="/perfil" element={<Animada><MeuPerfil /></Animada>} />
            </Route>
            <Route path="/medica/:id" element={<Animada><PerfilMedica /></Animada>} />
            <Route path="/medica/:id/avaliar" element={<Animada><NovaAvaliacao /></Animada>} />
            <Route path="/denunciar/:id?" element={<Animada><Denuncia /></Animada>} />
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
        <NavLink to="/perfil" data-tour="nav-perfil">
          <Icone nome="pessoa" />
          Meu perfil
        </NavLink>
      </nav>
    </>
  );
}

/**
 * Entrada de tela: desliza do lado de onde a usuária veio (avançar ou voltar).
 * A chave no caminho garante a animação também entre perfis de médicas diferentes.
 */
function Animada({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const tipo = useNavigationType();
  return (
    <div key={pathname} className="transicao-tela" data-direcao={tipo === 'POP' ? 'voltar' : 'avancar'}>
      {children}
    </div>
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
