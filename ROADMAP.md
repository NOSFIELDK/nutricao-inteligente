# 🗺️ Roadmap — Atualizações Pesadas LeifNutri

Sequenciado por dependência. **Metas nutricionais é a fundação**: Dashboard e Gerador de
plano consomem os números que ela produz. PWA é independente. Cada fase vira um branch/PR.

```
Fase 1: Metas + Onboarding      → produz calorias/macros reais   (foundation)
Fase 2: Dashboard com gráficos  → visualiza histórico vs metas
Fase 3: Gerador de plano semanal → usa metas da Fase 1
Fase 4: PWA (offline + instalável)
Extras: testes/CI · dark mode · export/import · macros via API (TACO/USDA)
```

---

## Fase 1 — Metas nutricionais reais + Onboarding
- [x] Estender `NutritionTargets` com `caloriesKcal`, `carbsG`, `fatG` (opcionais p/ retrocompat).
- [x] `UserProfile`: adicionar `goalIntent: "cutting" | "manutencao" | "bulking"` e `bodyFatPct?`.
- [x] Reescrever `domain/nutrition/targets.ts`: TMB (Mifflin-St Jeor) → TDEE → ajuste por objetivo
      → macros + `computeEnergy`. Retrocompatível.
- [x] `domain/nutrition/targets.test.ts` — 14 testes.
- [x] `pages/Profile.tsx`: campo `goalIntent` + card de prévia das metas ao vivo.
- [x] Migração store: não necessária (`goalIntent` é campo aninhado opcional do perfil).
- [x] Refatorar `insights.ts` para consumir `buildTargets`.
- [x] Surfacing de kcal/carbo/gordura no Dashboard.
- [ ] (Opcional) Wizard multi-step dedicado de primeiro acesso.
- [ ] (Pendente) Surfacing de kcal/macros em Histórico e Plano.
- **Aceite:** ✅ perfil real gera kcal+macros plausíveis; dados antigos não quebram. Build/lint/testes verdes.

## Fase 2 — Dashboard com gráficos
- [x] `components/charts/` em SVG puro (sem libs): LineChart, BarChart.
- [x] `weightByDate` no store (+ setter, migração v8, persist, sync) + input no check-in do Histórico.
- [x] `domain/nutrition/series.ts` (séries diárias, centraliza cálculo duplicado) + 6 testes.
- [x] Card "Progresso" no Dashboard com toggle 7/30 dias: peso, proteína, calorias, aderência.
- [x] Bônus: corrigido off-by-one de fuso em `utils/date.ts` (afetava o app inteiro).
- [ ] (Pendente) RingChart de macros do dia; skeleton loaders; gráficos na página Insights.
- **Aceite:** ✅ progresso de 7/30 dias em peso, proteína, kcal e aderência. Build/lint/testes verdes.

## Fase 3 — Gerador de plano semanal
- [ ] `domain/plan/generate.ts`: algoritmo guloso aproximando kcal/proteína, respeitando
      preferências/restrições, sem repetir receita em dias seguidos. Reusa `recommendCatalog`.
- [ ] `pages/Plan.tsx`: "Gerar semana", preview, regenerar dia, aceitar/descartar.
- [ ] Testes do gerador (restrições + aproximação de metas).
- **Aceite:** 1 clique → 7 dias coerentes com metas e restrições, editáveis.

## Fase 4 — PWA (offline + instalável)
- [x] `manifest.webmanifest` + `<link>` no index.html; `start_url`/scope com o basename (`/nutricao-inteligente/`); theme-color; ícones do logo.
- [ ] `vite-plugin-pwa` (Workbox): service worker (app shell precache; receitas do Worker em StaleWhileRevalidate).
- [ ] Lembretes via Notifications API quando instalado (fallback no `ReminderBanner`).
- [ ] Prompt de instalação (`beforeinstallprompt`).
- **Aceite:** instala no celular, abre offline, lembrete como notificação nativa.

## Extras (escopo confirmado)
- [x] Microinterações (hover/press) em cards e navegação + `prefers-reduced-motion`.
- [ ] Ampliar testes + CI (rede de segurança: targets, sync LWW, recommend).
- [ ] Dark mode refinado + skeletons.
- [ ] Export/import de dados (base em `storage/backup.ts`).
- [ ] Macros reais via API (TACO/USDA) para alimentos.

---

# 🪓 Leva "App profissional + Leif" (jun/2026)

## Mascote Leif
- [x] Mascote vetorial "Runic Craft" (avatar + corpo) com 6 humores (normal/motivate/warn/celebrate/sad/sleep).
- [x] Animações idle: respirar, piscar, pulinho ao comemorar.
- [x] Estilo blocky/clássico + tamanho (P/M/G) configuráveis em Ajustes (preview ao vivo).
- [x] Leif em telas: Painel, Insights, Receitas, Compras, Histórico, Plano, hero da página Sobre, loading e 404.
- [x] Leif comemora: aderência 100% no Painel, saque completo em Compras.
- [ ] **Pose "hero"** (mais dinâmica) + **escudo** como item alternativo ao machado, com variação por humor.

## Leif IA (chat de nutrição)
- [x] Worker: endpoint `POST /api/leif/chat` (Workers AI `@cf/meta/llama-3.1-8b-instruct`), persona + contexto do usuário.
- [x] Frontend: widget de chat flutuante (`LeifChat`) + `api/leifApi`.
- [ ] **BLOQUEADO**: deploy do worker travado em rate limit 10429 da Cloudflare. Reabilitar quando destravar (ver [[worker-deploy-ci]]).

## Salão (Painel)
- [x] "Hoje" com checklist do dia (água, proteína, fibras, check-in, peso) + barra de progresso.
- [x] Resumo semanal: streak (dias seguidos batendo meta) + bolinhas dos 7 dias + medalhas (🥉3d/🥈7d/🥇14d/🏆30d).
- [x] Cards de métrica clicáveis com modais de detalhe (via Trae).
- [ ] Cards de correlação simples: humor/fome/sono vs aderência e proteína.

## Histórico
- [x] Calendário mensal com bolinhas (água/meta/check-in/peso); clicar no dia abre o detalhe.
- [x] Exportar CSV (90 dias) com peso/água/macros/check-in.

## Plano
- [x] "Trocar" receita mantendo macros (proteína pesa mais; evita repetir no dia).
- [x] Lista de compras inteligente: agrupar por categoria (hortifrúti/proteínas/laticínios/grãos/temperos/outros) + quantidade.
- [ ] "Gerar semana" mais forte: gerador guloso aproximando metas, regenerar dia, aceitar/descartar (ver Fase 3).

## Insights / saúde
- [ ] Alertas mais "clínicos": fibra baixa, proteína baixa, água baixa; sódio/açúcar alto a partir de rótulos.
- [ ] Gráficos na página Insights (RingChart de macros do dia).

## Conta / sync
- [ ] Tela "Status da nuvem": último sync, itens pendentes, botão "forçar sync".
- [ ] Worker staging/prod separados + logs mínimos (sem dados sensíveis).
