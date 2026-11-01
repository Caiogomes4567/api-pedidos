# API de Gerenciamento de Pedidos

Projeto prático avaliativo — Tópicos Avançados em Sistemas de Informação II.
API REST em Node.js + Express para gerenciar pedidos de uma pequena loja, com armazenamento em memória.

- **Aluno:** Caio dos Santos Gomes  |  **RA:** 45341249
- **GitHub:** https://github.com/And0rade/<NOME-DO-REPOSITORIO>

## Instalação e execução

```bash
npm install
npm start      # sobe em http://localhost:3000 (porta configurável via PORT)
npm test       # executa os testes automatizados (Jest + Supertest)
```

> Os dados ficam em memória: ao reiniciar a aplicação, os pedidos são perdidos.

## Valores reconhecidos

| Campo | Valores aceitos |
|---|---|
| `tipo` | `entrega`, `retirada`, `local` |
| `prioridade` | `baixa`, `normal`, `alta` |
| `status` | `recebido`, `em_preparacao`, `enviado`, `entregue`, `cancelado` |

## Rotas

| Método | Rota | Sucesso | Erros |
|---|---|---|---|
| POST | `/pedidos` | 201 | 400 |
| GET | `/pedidos` | 200 | — |
| GET | `/pedidos/:id` | 200 | 404 |
| PATCH | `/pedidos/:id/status` | 200 | 400, 404 |

### Exemplos

**POST /pedidos**
```json
{ "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal" }
```
Resposta `201`:
```json
{ "id": 1, "cliente": "Carlos Silva", "tipo": "entrega", "valor": 350, "prioridade": "normal", "status": "recebido" }
```

**PATCH /pedidos/1/status**
```json
{ "status": "em_preparacao" }
```

**Erro (400)**
```json
{ "erro": "O campo \"valor\" deve ser numérico e maior que zero." }
```

## Regras de validação

- `cliente`: texto obrigatório; espaços nas extremidades são removidos (`"  Ana "` vira `"Ana"`); vazio ou só espaços → 400.
- `valor`: precisa ser do tipo número e maior que zero. A string `"350"` é rejeitada (decisão: não converter tipos silenciosamente).
- `tipo` e `prioridade`: devem estar nas listas acima.
- ID inexistente ou mal formado (`abc`, `0`, `-1`, `1.5`) → 404.
- JSON malformado → 400. Erro inesperado → 500 (`{"erro":"Erro interno do servidor."}`), sem vazar detalhes.
- Em `PATCH`, a existência do pedido é verificada antes do corpo (ID inexistente → 404 mesmo com corpo inválido).

## Transições de status

```
recebido ──► em_preparacao ──► enviado ──► entregue
   │               │
   └──► cancelado ◄┘
```

| De | Para (permitido) |
|---|---|
| `recebido` | `em_preparacao`, `cancelado` |
| `em_preparacao` | `enviado`, `cancelado` |
| `enviado` | `entregue` |
| `entregue`, `cancelado` | nenhum (estados finais) |

Transição não permitida → 400 com mensagem listando as opções válidas.

## Arquitetura

Arquitetura em camadas; cada camada só conhece a imediatamente abaixo:

```
src/
├── server.js                 # sobe o servidor (listen)
├── app.js                    # monta o Express, rotas e middlewares
├── routes/                   # mapeia método + URL -> controller
├── controllers/              # traduz HTTP <-> service (req/res, status 2xx)
├── services/                 # regras de negócio e validações
├── repositories/             # acesso aos dados (memória)
├── errors/AppError.js        # erro com status HTTP
└── middlewares/errorHandler.js  # converte erros em respostas JSON
tests/pedidos.test.js
```

**Por que `repositories/`, `errors/` e `middlewares/`?** O repository isola o armazenamento (trocar memória por banco muda só essa camada). O `AppError` permite ao service sinalizar 400/404 sem conhecer `req`/`res`. O `errorHandler` centraliza a resposta de erro e garante que erros inesperados virem 500, não 400.

**Separação `app.js` / `server.js`:** permite testar a API com Supertest sem abrir uma porta de rede.

## Testes

`npm test` executa 29 testes (Jest + Supertest) cobrindo: criação válida, espaços no nome, cada validação inválida, listagem, consulta (existente e IDs inexistentes/mal formados), transições válidas e proibidas, 404 no PATCH, rota inexistente e erro interno → 500.

Testes manuais: ver pasta `evidencias/` (Postman).

## Uso de IA

Utilizei IA (Claude, da Anthropic) como apoio nas seguintes tarefas: estruturar o projeto em camadas, escrever os testes com Jest/Supertest e rascunhar este README. Executei os testes (`npm test`), li o código e os endpoints foram testados manualmente no Postman (ver `evidencias/`).

- **Sugestão aceita:** separar o acesso a dados em `repositories/`. Aceitei porque isola o armazenamento em memória do restante e permitiria trocar por um banco sem alterar service e controller.
- **Sugestão aceita e conferida:** transição de status inválida responde 400 (e não 409). Mantive 400 porque o enunciado define 400 para "dados inválidos" e a mensagem lista as transições permitidas.
