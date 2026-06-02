# Nutrição Inteligente

App de nutrição que recomenda receitas, alimentos e suplementos de forma
personalizada por objetivo (**Saúde**, **Tratamento** ou **Performance**). O foco
é praticidade: plano semanal, lista de compras automática e alertas de
nutrientes — com todos os dados salvos localmente no dispositivo, sem necessidade
de login.

## Funcionalidades

- **Perfil & Objetivo** — coleta de dados (idade, sexo, peso, altura),
  preferências (vegano, low carb) e restrições (glúten, lactose) para guiar as
  recomendações.
- **Painel de Recomendações** — cards por categoria (Saúde, Doenças,
  Performance) com filtros e explicação do "por que isso?".
- **Receitas** — busca e filtros, com detalhe completo: ingredientes, modo de
  preparo, macros estimados e substituições.
- **Alimentos & Combinações** — sugestões rápidas por contexto (pré-treino,
  lanche, café da manhã).
- **Suplementos** — orientações sobre whey, creatina e BCAA, com avisos e
  melhores horários.
- **Plano Semanal** — montagem de refeições por dia/horário com visão de macros.
- **Lista de Compras** — agregação automática do plano, agrupada por seção.
- **Insights de Nutrientes** — alertas de lacunas prováveis (ferro, fibras,
  proteína) com sugestões de correção.
- **Configurações** — tema claro/escuro, unidades e backup/restore local (JSON).

## Stack

- [React](https://react.dev/) 18 + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/) (build e dev server com HMR)
- [Tailwind CSS](https://tailwindcss.com/) para estilização
- [React Router](https://reactrouter.com/) para navegação
- [Zustand](https://zustand-demo.pmnd.rs/) para estado global
- [Vitest](https://vitest.dev/) para testes

## Como rodar

Pré-requisitos: [Node.js](https://nodejs.org/) 18+ e npm.

```bash
# instalar dependências
npm install

# iniciar o servidor de desenvolvimento
npm run dev
```

Acesse o endereço exibido no terminal (por padrão `http://localhost:5173`).

## Scripts disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento com HMR. |
| `npm run build` | Faz a verificação de tipos e gera o build de produção. |
| `npm run preview` | Serve localmente o build de produção. |
| `npm run lint` | Roda o ESLint no projeto. |
| `npm run check` | Verifica os tipos com o TypeScript (sem emitir arquivos). |
| `npm test` | Roda a suíte de testes uma vez. |
| `npm run test:watch` | Roda os testes em modo watch. |

## Estrutura do projeto

```
src/
├── components/   # componentes de UI reutilizáveis
├── data/         # catálogo de dados (receitas, alimentos, suplementos)
├── domain/       # regras de negócio (recomendação, nutrição)
├── hooks/        # hooks customizados
├── pages/        # telas da aplicação
├── storage/      # persistência local (backup/restore)
├── store/        # estado global (Zustand)
└── utils/        # utilitários
```

## Privacidade

Os dados do usuário são armazenados **apenas localmente** no navegador. Não há
backend nem coleta de informações — o backup/restore é feito por exportação
manual em JSON nas Configurações.
