export type PrimaryGoal = "saude" | "tratamento" | "performance";

export type DietaryPreference = "onivoro" | "vegetariano" | "vegano" | "lowCarb";

export type Restriction = "lactose" | "gluten";

export type Condition = "diabetes" | "hipertensao";

export type ActivityLevel = "baixo" | "moderado" | "alto";

export type UserProfile = {
  id: string;
  age: number;
  sex: "f" | "m" | "outro";
  weightKg: number;
  heightCm: number;
  primaryGoal: PrimaryGoal;
  dietaryPreferences: DietaryPreference[];
  restrictions: Restriction[];
  conditions: Condition[];
  activityLevel: ActivityLevel;
};

export type CatalogTag =
  | "highProtein"
  | "highFiber"
  | "lowGI"
  | "lowSodium"
  | "lactoseFree"
  | "glutenFree"
  | "vegan"
  | "vegetarian"
  | "lowCarb"
  | "preWorkout"
  | "postWorkout"
  | "energy"
  | "hydration"
  | "ironRich"
  | "calciumRich";

export type IngredientNote = {
  ingredient: string;
  benefit: string;
};

export type RecipeTag = CatalogTag | string;

export type Recipe = {
  id: string;
  type: "recipe";
  title: string;
  imageUrl: string;
  category: "saude" | "tratamento" | "performance";
  tags: RecipeTag[];
  prepMinutes: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  ingredientNotes?: IngredientNote[];
};

export type ReminderInterval = 30 | 60 | 90 | 120 | 180;

export type AppReminder = {
  id: string;
  label: string;
  message: string;
  intervalMinutes: ReminderInterval;
  enabled: boolean;
};

export type FoodSuggestion = {
  id: string;
  type: "food";
  title: string;
  context: string;
  tags: CatalogTag[];
  why: string;
};

export type Supplement = {
  id: string;
  type: "supplement";
  name: string;
  purpose: string;
  tags: CatalogTag[];
  howToUse: string;
  cautions: string;
};

export type CatalogItem = Recipe | FoodSuggestion | Supplement;

export type MealSlot = "cafe" | "almoco" | "lanche" | "jantar";

export type PlanItem = {
  id: string;
  dateISO: string;
  mealSlot: MealSlot;
  itemType: CatalogItem["type"];
  itemId: string;
  servings: number;
};

export type Favorite = {
  id: string;
  itemType: CatalogItem["type"];
  itemId: string;
};

export type NutritionTargets = {
  proteinG: number;
  fiberG: number;
  waterMl: number;
};

export type DailyTotals = {
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  waterMl: number;
};

export type ManualEntry = {
  id: string;
  dateISO: string;
  title: string;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export type FontScale = "100" | "112" | "125";

export type RecommendationReason = {
  tag: CatalogTag;
  label: string;
};

export type Recommendation = {
  item: CatalogItem;
  score: number;
  reasons: RecommendationReason[];
};

export type MoodScore = 1 | 2 | 3 | 4 | 5;

export type DailyCheckIn = {
  dateISO: string;
  sleepHours: number | null;
  mood: MoodScore | null;
  hunger: MoodScore | null;
  training: boolean;
  notes: string;
};

export type LabelScan = {
  id: string;
  dateISO: string;
  product: string;
  serving: string;
  caloriesKcal: number | null;
  sugarG: number;
  sodiumMg: number;
};
