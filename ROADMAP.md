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
- [ ] `vite-plugin-pwa` (Workbox): manifest + service worker.
- [ ] App shell precache; receitas do Worker em StaleWhileRevalidate.
- [ ] `start_url`/scope com o basename do GitHub Pages (`/nutricao-inteligente/`).
- [ ] Lembretes via Notifications API quando instalado (fallback no `ReminderBanner`).
- [ ] Prompt de instalação (`beforeinstallprompt`).
- **Aceite:** instala no celular, abre offline, lembrete como notificação nativa.

## Extras (escopo confirmado)
- [ ] Ampliar testes + CI (rede de segurança: targets, sync LWW, recommend).
- [ ] Dark mode refinado + microinterações + skeletons.
- [ ] Export/import de dados (base em `storage/backup.ts`).
- [ ] Macros reais via API (TACO/USDA) para alimentos.
