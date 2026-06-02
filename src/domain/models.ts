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

export type Recipe = {
  id: string;
  type: "recipe";
  title: string;
  imageUrl: string;
  category: "saude" | "tratamento" | "performance";
  tags: CatalogTag[];
  prepMinutes: number;
  servings: number;
  ingredients: string[];
  steps: string[];
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
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

export type RecommendationReason = {
  tag: CatalogTag;
  label: string;
};

export type Recommendation = {
  item: CatalogItem;
  score: number;
  reasons: RecommendationReason[];
};
