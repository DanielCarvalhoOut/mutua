import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { criarServicos, ServicosProvider } from './app/servicos';
import { acompanharSistema, aplicarTema, lerTema } from './app/tema';
import './shared/estilos/tokens.css';
import './shared/estilos/app.css';

// Antes do primeiro desenho, para não piscar o tema errado.
aplicarTema(lerTema());
acompanharSistema();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServicosProvider servicos={criarServicos()}>
      <App />
    </ServicosProvider>
  </StrictMode>,
);
