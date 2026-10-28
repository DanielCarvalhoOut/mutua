import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { criarServicos, ServicosProvider } from './app/servicos';
import './shared/estilos/tokens.css';
import './shared/estilos/app.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ServicosProvider servicos={criarServicos()}>
      <App />
    </ServicosProvider>
  </StrictMode>,
);
