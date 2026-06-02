type Env = {
  NUTRI_KV: KVNamespace;
  USDA_API_KEY?: string;
  MEALDB_BASE?: string;
  FDC_BASE?: string;
};

type Macros = {
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

type NormalizedRecipe = {
  id: string;
  type: "recipe";
  title: string;
  imageUrl: string;
  category: "saude" | "tratamento" | "performance";
  tags: string[];
  prepMinutes: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

type MealDbRecipe = {
  idMeal: string;
  strMeal: string;
  strCategory: string | null;
  strArea: string | null;
  strInstructions: string | null;
  strMealThumb: string | null;
  strTags: string | null;
  [k: string]: unknown;
};

function json<T>(data: T, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,OPTIONS",
      "access-control-allow-headers": "content-type",
      ...(init?.headers ?? {}),
    },
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

function normalizeKey(s: string) {
  return s
    .toLowerCase()
    .replace(/[\u00B0]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseFraction(s: string) {
  const m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return a / b;
}

function parseQuantity(raw: string) {
  const s = raw.trim().toLowerCase();
  const tokens = s.split(/\s+/g);
  if (tokens.length === 0) return { qty: 0, unit: "", rest: s };

  const first = tokens[0];
  const frac = parseFraction(first);
  if (frac !== null) {
    return { qty: frac, unit: tokens[1] ?? "", rest: tokens.slice(2).join(" ") };
  }

  const n = Number(first.replace(",", "."));
  if (Number.isFinite(n)) {
    return { qty: n, unit: tokens[1] ?? "", rest: tokens.slice(2).join(" ") };
  }

  return { qty: 0, unit: "", rest: s };
}

const volumeToMl: Record<string, number> = {
  tsp: 5,
  teaspoon: 5,
  tsps: 5,
  tbsp: 15,
  tablespoon: 15,
  tbsps: 15,
  cup: 240,
  cups: 240,
  ml: 1,
  l: 1000,
  liter: 1000,
  litre: 1000,
};

const massToG: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const unitItemWeightG: Record<string, number> = {
  clove: 3,
  cloves: 3,
  slice: 25,
  slices: 25,
  piece: 50,
  pieces: 50,
};

const ingredientUnitWeightG: Record<string, number> = {
  egg: 50,
  eggs: 50,
  banana: 118,
  onion: 110,
  garlic: 3,
  tomato: 120,
};

function estimateIngredientGrams(ingredient: string, measure: string) {
  const iKey = normalizeKey(ingredient);
  const mKey = normalizeKey(measure);
  if (!iKey || !mKey) return 0;
  if (mKey.includes("to taste")) return 0;

  const { qty, unit } = parseQuantity(mKey);
  const u = unit.replace(/\./g, "");

  if (massToG[u]) return qty * massToG[u];

  if (volumeToMl[u]) {
    const ml = qty * volumeToMl[u];
    const density = 1;
    return ml * density;
  }

  if (unitItemWeightG[u]) return qty * unitItemWeightG[u];

  if (qty > 0 && !unit) {
    const per = ingredientUnitWeightG[iKey];
    if (per) return qty * per;
    return qty * 50;
  }

  return 0;
}

function extractIngredients(r: MealDbRecipe) {
  const items: { ingredient: string; measure: string; grams: number }[] = [];
  for (let idx = 1; idx <= 20; idx += 1) {
    const ingRaw = (r[`strIngredient${idx}`] ?? "") as string;
    const meaRaw = (r[`strMeasure${idx}`] ?? "") as string;
    const ingredient = (ingRaw ?? "").trim();
    const measure = (meaRaw ?? "").trim();
    if (!ingredient) continue;
    const grams = estimateIngredientGrams(ingredient, measure);
    items.push({ ingredient, measure, grams });
  }
  return items;
}

function defaultCategory(r: MealDbRecipe): NormalizedRecipe["category"] {
  const cat = (r.strCategory ?? "").toLowerCase();
  if (/(beef|chicken|lamb|pork|seafood|starter|side)/.test(cat)) return "performance";
  if (/(dessert)/.test(cat)) return "tratamento";
  return "saude";
}

function splitSteps(instructions: string | null) {
  const raw = (instructions ?? "").replace(/\r/g, "\n");
  const parts = raw
    .split(/\n+/g)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length > 0) return parts;
  return raw
    .split(/[.?!]\s+/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);
}

async function fetchMealDb(env: Env, path: string) {
  const base = env.MEALDB_BASE ?? "https://www.themealdb.com/api/json/v1/1";
  const url = `${base}${path}`;
  const res = await fetch(url, { cf: { cacheTtl: 60, cacheEverything: true } as RequestInitCfProperties });
  if (!res.ok) throw new Error(`MealDB ${res.status}`);
  return (await res.json()) as { meals: MealDbRecipe[] | null };
}

async function fetchMealDbRandom(env: Env) {
  const data = await fetchMealDb(env, "/random.php");
  return data.meals?.[0] ?? null;
}

type UsdaNutrient = { nutrientName: string; unitName: string; value: number };
type UsdaFood = { description: string; fdcId: number; foodNutrients?: UsdaNutrient[] };

function pickMacros(nutrients: UsdaNutrient[]) {
  const find = (name: string) =>
    nutrients.find((n) => n.nutrientName.toLowerCase() === name.toLowerCase())?.value ?? null;

  const protein = find("Protein") ?? 0;
  const fat = find("Total lipid (fat)") ?? 0;
  const carbs = find("Carbohydrate, by difference") ?? 0;
  const fiber = find("Fiber, total dietary") ?? 0;

  return { proteinG: protein, carbsG: carbs, fatG: fat, fiberG: fiber };
}

async function fetchUsdaMacrosPer100g(env: Env, ingredient: string) {
  if (!env.USDA_API_KEY) return null;
  const base = env.FDC_BASE ?? "https://api.nal.usda.gov/fdc/v1";
  const url = new URL(`${base}/foods/search`);
  url.searchParams.set("api_key", env.USDA_API_KEY);
  url.searchParams.set("query", ingredient);
  url.searchParams.set("pageSize", "1");
  url.searchParams.set("dataType", "Foundation,Survey (FNDDS)");

  const res = await fetch(url.toString(), { cf: { cacheTtl: 3600, cacheEverything: true } as RequestInitCfProperties });
  if (!res.ok) return null;
  const data = (await res.json()) as { foods?: UsdaFood[] };
  const food = data.foods?.[0];
  if (!food?.foodNutrients) return null;
  return pickMacros(food.foodNutrients);
}

async function getCachedJson<T>(env: Env, key: string) {
  const raw = await env.NUTRI_KV.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

async function putCachedJson(env: Env, key: string, value: unknown, ttlSeconds: number) {
  await env.NUTRI_KV.put(key, JSON.stringify(value), { expirationTtl: ttlSeconds });
}

async function computeRecipeMacros(env: Env, r: MealDbRecipe) {
  const ingredients = extractIngredients(r);
  let total: Macros = { proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };

  for (const ing of ingredients) {
    const grams = ing.grams;
    if (!grams || grams <= 0) continue;
    const key = `nutrient:${normalizeKey(ing.ingredient)}`;
    let per100 = await getCachedJson<Macros>(env, key);
    if (!per100) {
      per100 = (await fetchUsdaMacrosPer100g(env, ing.ingredient)) ?? { proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
      await putCachedJson(env, key, per100, 60 * 60 * 24 * 30);
    }
    const mult = grams / 100;
    total = {
      proteinG: total.proteinG + per100.proteinG * mult,
      carbsG: total.carbsG + per100.carbsG * mult,
      fatG: total.fatG + per100.fatG * mult,
      fiberG: total.fiberG + per100.fiberG * mult,
    };
  }

  return {
    proteinG: round1(total.proteinG),
    carbsG: round1(total.carbsG),
    fatG: round1(total.fatG),
    fiberG: round1(total.fiberG),
  };
}

function normalizeRecipe(r: MealDbRecipe, macros: Macros): NormalizedRecipe {
  const id = `themealdb:${r.idMeal}`;
  const tags = (r.strTags ?? "")
    .split(",")
    .map((t) => normalizeKey(t))
    .filter(Boolean);

  const ingredients = extractIngredients(r).map((i) => (i.measure ? `${i.measure} ${i.ingredient}` : i.ingredient).trim());
  const steps = splitSteps(r.strInstructions);

  return {
    id,
    type: "recipe",
    title: r.strMeal,
    imageUrl: r.strMealThumb ?? "",
    category: defaultCategory(r),
    tags,
    prepMinutes: 25,
    servings: 2,
    ingredients,
    steps,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
    fiberG: macros.fiberG,
  };
}

function notFound() {
  return json({ error: "not_found" }, { status: 404 });
}

function badRequest(message: string) {
  return json({ error: "bad_request", message }, { status: 400 });
}

function internalError(message: string) {
  return json({ error: "internal_error", message }, { status: 500 });
}

async function getOrComputeNormalizedRecipe(env: Env, meal: MealDbRecipe) {
  const cacheKey = `recipe:themealdb:${meal.idMeal}`;
  const cached = await getCachedJson<NormalizedRecipe>(env, cacheKey);
  if (cached) return cached;
  const macros = await computeRecipeMacros(env, meal);
  const normalized = normalizeRecipe(meal, macros);
  await putCachedJson(env, cacheKey, normalized, 60 * 60 * 24 * 30);
  return normalized;
}

async function handleDiscover(env: Env, seed: string, page: number, pageSize: number) {
  const s = normalizeKey(seed || "default") || "default";
  const cacheKey = `discover:${s}:${page}:${pageSize}`;
  const cached = await getCachedJson<{
    source: string;
    mode: "discover";
    seed: string;
    page: number;
    pageSize: number;
    total: number;
    items: NormalizedRecipe[];
  }>(env, cacheKey);
  if (cached) return cached;

  const ids = new Set<string>();
  const items: NormalizedRecipe[] = [];
  for (let tries = 0; tries < pageSize * 3 && items.length < pageSize; tries += 1) {
    const meal = await fetchMealDbRandom(env);
    if (!meal) break;
    if (ids.has(meal.idMeal)) continue;
    ids.add(meal.idMeal);
    const normalized = await getOrComputeNormalizedRecipe(env, meal);
    items.push(normalized);
  }

  const payload = {
    source: "themealdb",
    mode: "discover" as const,
    seed,
    page,
    pageSize,
    total: 1000000,
    items,
  };
  await putCachedJson(env, cacheKey, payload, 60 * 60 * 24 * 7);
  return payload;
}

async function handleSearch(req: Request, env: Env) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const seed = url.searchParams.get("seed")?.trim() ?? "default";
  const page = clamp(Number(url.searchParams.get("page") ?? "1") || 1, 1, 999);
  const pageSize = clamp(Number(url.searchParams.get("pageSize") ?? "12") || 12, 6, 24);

  if (!q) {
    const payload = await handleDiscover(env, seed, page, pageSize);
    return json(payload);
  }

  const data = await fetchMealDb(env, `/search.php?s=${encodeURIComponent(q)}`);
  const meals = data.meals ?? [];
  const start = (page - 1) * pageSize;
  const slice = meals.slice(start, start + pageSize);

  const items: NormalizedRecipe[] = [];
  for (const r of slice) {
    const normalized = await getOrComputeNormalizedRecipe(env, r);
    items.push(normalized);
  }

  return json({
    source: "themealdb",
    mode: "search",
    seed,
    page,
    pageSize,
    total: meals.length,
    items,
  });
}

async function handleGetById(req: Request, env: Env) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const id = decodeURIComponent(parts[parts.length - 1] ?? "");
  if (!id) return badRequest("missing id");

  const [source, rawId] = id.includes(":") ? id.split(":", 2) : ["themealdb", id];
  if (source !== "themealdb") return badRequest("unsupported source");

  const cacheKey = `recipe:themealdb:${rawId}`;
  const cached = await getCachedJson<NormalizedRecipe>(env, cacheKey);
  if (cached) return json(cached);

  const data = await fetchMealDb(env, `/lookup.php?i=${encodeURIComponent(rawId)}`);
  const meal = data.meals?.[0];
  if (!meal) return notFound();

  const macros = await computeRecipeMacros(env, meal);
  const normalized = normalizeRecipe(meal, macros);
  await putCachedJson(env, cacheKey, normalized, 60 * 60 * 24 * 30);
  return json(normalized);
}

export default {
  async fetch(req: Request, env: Env) {
    if (req.method === "OPTIONS") return json({ ok: true });
    if (req.method !== "GET") return json({ error: "method_not_allowed" }, { status: 405 });

    try {
      const url = new URL(req.url);
      if (!url.pathname.startsWith("/api/")) return notFound();

      if (url.pathname === "/api/recipes/search") return await handleSearch(req, env);
      if (url.pathname.startsWith("/api/recipes/")) return await handleGetById(req, env);

      return notFound();
    } catch (e) {
      const message = e instanceof Error ? e.message : "unknown";
      return internalError(message);
    }
  },
};
