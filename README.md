# Mútua

**Cuidado de quem também viveu.**

Recomendação e priorização de consultas e exames com médicas que compartilham vivências de saúde com a paciente: climatério/menopausa, endometriose, SOP, maternidade atípica, câncer de mama e outras. Projeto do IV CodeCraft (PUC Goiás), tema *Ciência e Tecnologia para a Saúde Delas*.

> Protótipo: médicas, registros e avaliações são **fictícios**.

## O que o app faz

| Tela | O que mostra |
|---|---|
| Boas-vindas | Proposta, autodeclaração ("espaço para todas as mulheres") e atalho com perfil de exemplo |
| Cadastro (3 passos) | Idade e últimos exames → vivências → especialidade e preferências de atendimento |
| Minhas médicas | **O que priorizar agora** (mamografia, preventivo) e **top 5** com % de afinidade, o que tem e o que não tem do que você pediu, e "por que recomendamos mesmo assim" quando nenhuma compartilha todas as vivências |
| Perfil da médica | CRM e RQE verificados, composição do match com pesos, vivências autodeclaradas (LGPD), resumo automático das avaliações, nota entre mulheres parecidas, critérios de respeito e avaliações protegidas |
| Avaliar consulta | Nota, critérios (respeito, explicou, consentimento, acompanhante), texto e vivências da autora; publicada, a médica não edita nem apaga |
| Meu perfil | Resumo, status dos exames e **apagar meus dados** |

### Regras de negócio

- **Vivência não substitui competência.** Pesos do match: qualificação 35%, avaliações 30%, vivências em comum 25%, preferências 10% (`src/domain/matching.ts`). Só entram médicas com CRM verificado.
- **Nota justa.** Média bayesiana: poucas avaliações puxam a nota para a média da plataforma.
- **Priorização.** Mamografia a cada 2 anos dos 50 aos 74; dos 40 aos 49 garantida pela Lei 11.664/2008, com frequência definida com a médica; histórico familiar antecipa. Preventivo dos 25 aos 64, a cada 3 anos (`src/domain/prioridade.ts`).
- **LGPD.** Vivência da médica é dado sensível: autodeclarada, com data de consentimento e revogável. A paciente apaga os próprios dados quando quiser.
- **Avaliações só de inclusão.** O repositório não tem método de editar ou apagar.

## Rodar

```bash
npm install
npm run dev      # http://localhost:5173 (também aparece na rede local, para abrir no celular)
npm test         # testes do domínio
npm run build    # gera dist/ estático
```

## Publicar

O build é estático (`base: './'` e `HashRouter`), então funciona em qualquer hospedagem sem configuração de servidor:

- **Vercel / Netlify:** importe o repositório; comando `npm run build`, pasta `dist`.
- **GitHub Pages:** publique o conteúdo de `dist/`.

## Arquitetura

Veja [docs/ARQUITETURA.md](docs/ARQUITETURA.md).
