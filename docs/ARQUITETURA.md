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

## Denúncias

**No app (pronto):** `features/denuncia` (formulário, confirmação e sucesso), regras em `domain/denuncia.ts` e porta `DenunciaRepository`, que só tem `registrar`.

- Validação: médica, data/hora não futura, tipo, motivo com 20 a 3000 caracteres e escolha de anonimato.
- Anônima: `montarDenuncia` descarta o identificador da paciente antes do envio; ele não sai do aparelho.
- A resposta é só o comprovante (`protocolo`, `criadoEm`). O app não tem como listar nem consultar denúncias.
- Reenvio idêntico em até 2 minutos é bloqueado.
- Nada do conteúdo vai para mensagens de erro ou console. O adaptador local guarda os registros só em memória.

**Contrato do backend (a implementar):**

| Rota | Quem pode | Observação |
|---|---|---|
| `POST /denuncias` | Paciente autenticada | Se `anonima`, ignora qualquer `pacienteId` recebido e não grava IP nem sessão junto ao registro. Gera protocolo único (índice único no banco). Rate limit por usuária. |
| `GET /denuncias` | Só perfil `COMPLIANCE` | Nunca exposto para médica nem paciente. |
| `GET /denuncias/:id` | Só perfil `COMPLIANCE` | Sem permissão: 404, sem revelar se existe. |
| `PATCH /denuncias/:id/status` | Só perfil `COMPLIANCE` | `ABERTA → EM_ANALISE → CONCLUIDA`, com log de auditoria (quem, quando, de/para). |

Tabelas previstas: `denuncia` (id, protocolo único, paciente_id nulo se anônima, medica_id, consulta_id opcional, tipo_ocorrencia, motivo criptografado, anonima, status, criado_em, atualizado_em) e `denuncia_auditoria` (id, denuncia_id, usuario_id, status_de, status_para, criado_em). A médica denunciada nunca é notificada. Anexos (imagem/PDF) entram quando houver armazenamento de arquivos.

## LGPD

- Vivências da médica: dado sensível (art. 11), com consentimento explícito registrado (`consentimentoEm`) e revogável.
- Dados da paciente: hoje só no aparelho; "Apagar meus dados" remove tudo. No backend, o mesmo direito vira um endpoint de exclusão.
- Avaliações não mostram nome, só faixa etária e vivências que a autora escolheu exibir.
