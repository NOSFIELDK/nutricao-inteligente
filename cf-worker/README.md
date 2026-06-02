# API (Cloudflare Worker)

Este worker expõe endpoints para buscar receitas (TheMealDB) e calcular macros estimados por ingredientes usando USDA FoodData Central, com cache em KV.

## Endpoints

- `GET /api/recipes/search?q=<texto>&page=1&pageSize=12`
- `GET /api/recipes/<id>` (id no formato `themealdb:<idMeal>`)

## Variáveis / Secrets

- `USDA_API_KEY` (obrigatório para macros)

## Cache (KV)

Configure um KV namespace e preencha o `id` em `wrangler.toml` (binding: `NUTRI_KV`).

## Deploy

1. `cd cf-worker`
2. `npm install`
3. `npx wrangler login`
4. `npx wrangler kv namespace create NUTRI_KV`
5. Copie o `id` gerado para `wrangler.toml` em `[[kv_namespaces]]`
6. `npx wrangler secret put USDA_API_KEY`
7. `npm run deploy`

Depois, copie a URL do worker e coloque no app em **Configurações → API de receitas**.
