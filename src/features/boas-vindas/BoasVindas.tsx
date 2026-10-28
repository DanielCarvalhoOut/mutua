import { useNavigate } from 'react-router-dom';
import { PERFIL_EXEMPLO, usePerfil } from '@/app/perfil';
import { Icone } from '@/shared/ui/Icone';
import './boas-vindas.css';

export function BoasVindas() {
  const navegar = useNavigate();
  const { perfil, salvar } = usePerfil();

  const verExemplo = () => {
    salvar(PERFIL_EXEMPLO);
    navegar('/recomendacoes');
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
        {perfil ? (
          <button type="button" className="btn btn-primario btn-bloco" onClick={() => navegar('/recomendacoes')}>
            Ver minhas médicas
          </button>
        ) : (
          <button type="button" className="btn btn-primario btn-bloco" onClick={() => navegar('/comecar')}>
            Sou mulher, quero começar
          </button>
        )}
        <button type="button" className="btn btn-texto" onClick={verExemplo}>
          Ver com um perfil de exemplo
        </button>
        <p className="texto-sec bv-legal">
          A Mútua é um espaço de mulheres para mulheres. Ao continuar, você confirma que é mulher.
        </p>
      </div>
      <p className="faixa-demo">Protótipo do IV CodeCraft · médicas e avaliações fictícias</p>
    </main>
  );
}
