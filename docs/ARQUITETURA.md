# Arquitetura da Mútua

## Visão geral

```
src/
  domain/        Regras puras em TypeScript: tipos, match, priorização, resumo e portas
  adapters/      Implementações das portas
    mock/        Dados fictícios + avaliações e perfil no navegador (padrão)
    http/        Cliente do backend REST (contrato definido, servidor futuro)
    resumo/      Resumo de avaliações por regras
  integrations/  Interfaces das integrações públicas e privadas (implementação futura)
  app/           Composição: escolha de adaptadores, rotas, contexto do perfil
  features/      Uma pasta por tela/fluxo (boas-vindas, cadastro, recomendacoes, medica, avaliacao, perfil)
  shared/        Design system: tokens, estilos e componentes
```

O fluxo de dependência é de fora para dentro: `features → app → domain ← adapters`. O domínio não importa React, rede nem armazenamento.

## Decisões

| Decisão | Por quê |
|---|---|
| Domínio puro (`src/domain`) | O mesmo código de match e priorização roda no navegador hoje e pode ir para um serviço de backend sem reescrita. É testado isoladamente (`npm test`). |
| Portas e adaptadores (`domain/ports.ts`) | As telas conversam com interfaces. Trocar dados fictícios por API, CNES ou operadora é trocar o adaptador em `app/servicos.tsx`, sem tocar nas telas. |
| Configuração por ambiente | `VITE_DATA_SOURCE=mock|api` e `VITE_API_URL` escolhem a fonte (ver `.env.example`). |
| Avaliações só de inclusão | `AvaliacaoRepository` não tem `editar` nem `apagar`. Remoção é responsabilidade da moderação, num fluxo separado e auditado. |
| Resumo como provedor | `ResumoProvider` hoje usa regras; pode virar um modelo de linguagem sem mudar a tela. |
| Feature folders | Cada fluxo tem componentes e estilos próprios; equipes diferentes trabalham em paralelo com pouco conflito. |
| Front estático | `HashRouter` e `base: './'`: o build roda em qualquer CDN, sem servidor de aplicação. |

## Crescimento vertical e horizontal

**Vertical (mais funcionalidades):** novas telas entram como novas pastas em `features/`; novas regras entram no domínio com testes; novos critérios de match são um novo componente em `PESOS`.

**Horizontal (mais usuárias e regiões):** o front é estático e servido por CDN, sem estado no servidor. O backend previsto segue o mesmo desenho:

```
CDN (front estático)
   │
API Gateway ── Serviço de perfis e avaliações (stateless, N réplicas)
   │                 └─ PostgreSQL (avaliações append-only, réplicas de leitura)
   ├────────── Serviço de recomendação (reusa src/domain, N réplicas, cache por perfil)
   └────────── Workers de integração (filas): CFM, CNES, operadoras, agendas
```

- Serviços sem estado escalam com réplicas atrás do balanceador.
- Avaliações em tabela só de inclusão; agregados (média, critérios) recalculados por evento.
- Recomendação é uma função pura, então pode ser cacheada e particionada por região (UF/município).
- Integrações rodam em filas para não travar a usuária quando uma fonte externa estiver lenta.

## Integrações futuras

Interfaces em `src/integrations/fontes.ts`:

| Fonte | Tipo | Uso |
|---|---|---|
| CFM (Busca Médico) | Pública | Validar CRM e RQE (`crmVerificado`, `rqe`) |
| CNES (DataSUS) | Pública | Profissionais e estabelecimentos que atendem pelo SUS |
| Regulação do SUS | Pública | Encaminhamento qualificado usando as preferências da paciente |
| Operadoras de plano | Privada | Rede credenciada e agenda |
| Clínicas parceiras | Privada | Agenda e código da consulta, que comprova a avaliação |

## LGPD

- Vivências da médica: dado sensível (art. 11), com consentimento explícito registrado (`consentimentoEm`) e revogável.
- Dados da paciente: hoje só no aparelho; "Apagar meus dados" remove tudo. No backend, o mesmo direito vira um endpoint de exclusão.
- Avaliações não mostram nome, só faixa etária e vivências que a autora escolheu exibir.
