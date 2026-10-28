import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PERFIL_EXEMPLO, usePerfil } from '@/app/perfil';
import { Icone } from '@/shared/ui/Icone';
import './boas-vindas.css';

export function BoasVindas() {
  const navegar = useNavigate();
  const { perfil, salvar } = usePerfil();
  const [escolhendo, setEscolhendo] = useState(false);
  // Ignora toques nos primeiros instantes da janela: no celular, o mesmo toque que a abriu
  // pode cair numa opção que aparece embaixo do dedo ("clique fantasma").
  const abertaEm = useRef(0);
  const abrirEscolha = () => {
    abertaEm.current = Date.now();
    setEscolhendo(true);
  };
  const seguro = (acao: () => void) => () => {
    if (Date.now() - abertaEm.current > 400) acao();
  };

  const verExemplo = () => {
    salvar(PERFIL_EXEMPLO);
    navegar('/recomendacoes', { state: { tour: true } });
  };

  return (
    <main className="tela boas-vindas">
      <div className="bv-marca">
        {/* Símbolo em imagem e nome em texto: o nome segue a cor do tema (claro e escuro). */}
        <img src="./logo-simbolo.png" alt="" className="bv-logo" />
        <span className="bv-nome">Mútua</span>
        <p className="bv-slogan">Cuidar é uma troca.</p>
      </div>

      <div className="bv-pontos">
        <p className="bv-intro">
          Encontre médicas que entendem o que você vive, com avaliações escritas só por mulheres.
        </p>
        <ul>
          <li>
            <Icone nome="coracao" />
            <span>Afinidade por vivências como climatério, endometriose e maternidade atípica</span>
          </li>
          <li>
            <Icone nome="escudo" />
            <span>CRM e especialidade verificados antes de qualquer recomendação</span>
          </li>
          <li>
            <Icone nome="cadeado" />
            <span>Avaliações que a médica não pode editar nem apagar</span>
          </li>
          <li>
            <Icone nome="calendario" />
            <span>Aviso de quais exames priorizar para a sua idade</span>
          </li>
        </ul>
      </div>

      <div className="bv-acoes">
        <button type="button" className="btn btn-primario btn-bloco" onClick={abrirEscolha}>
          Ver minhas médicas
        </button>
        <p className="texto-sec bv-legal">
          A Mútua é um espaço de mulheres para mulheres. Ao continuar, você confirma que é mulher.
        </p>
      </div>
      <p className="faixa-demo">Protótipo do IV CodeCraft · médicas e avaliações fictícias</p>

      {/* Antes de entrar, ela escolhe com qual perfil quer ver as recomendações. */}
      {escolhendo && (
        <div className="fundo-modal" onClick={seguro(() => setEscolhendo(false))}>
          <div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bv-escolha-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="bv-escolha-titulo" className="secao-titulo">
              Como você quer começar?
            </h2>
            <div className="bv-opcoes">
              {perfil && (
                <button type="button" className="bv-opcao" onClick={seguro(() => navegar('/recomendacoes'))}>
                  <Icone nome="pessoa" />
                  <span>
                    <strong>Continuar com meu perfil</strong>
                    <span className="texto-sec">Suas respostas já estão salvas neste aparelho.</span>
                  </span>
                </button>
              )}
              <button
                type="button"
                className="bv-opcao"
                onClick={seguro(() => navegar('/comecar', { state: { novo: true } }))}
              >
                <Icone nome="editar" />
                <span>
                  <strong>Criar um novo perfil</strong>
                  <span className="texto-sec">3 passos rápidos para recomendações feitas para você.</span>
                </span>
              </button>
              <button type="button" className="bv-opcao" onClick={seguro(verExemplo)}>
                <Icone nome="brilho" />
                <span>
                  <strong>Entrar com um perfil de exemplo</strong>
                  <span className="texto-sec">Veja como funciona com uma mulher de 52 anos, com um tour guiado.</span>
                </span>
              </button>
            </div>
            <button type="button" className="btn btn-texto" onClick={() => setEscolhendo(false)}>
              Agora não
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
