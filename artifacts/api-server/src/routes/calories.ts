import { Router } from "express";
import { EstimateCaloriesBody } from "@workspace/api-zod";

const router = Router();

type FoodCategory = "healthy" | "moderate" | "junk";

interface FoodEntry {
  keywords: string[];
  name: string;
  calories: number;
  proteinG: number;
  unit: string;
  category: FoodCategory;
}

const FOOD_DB: FoodEntry[] = [
  // Eggs & dairy
  { keywords: ["scrambled egg", "scrambled eggs"], name: "Scrambled eggs", calories: 91, proteinG: 6, unit: "serving", category: "healthy" },
  { keywords: ["fried egg", "fried eggs"], name: "Fried egg", calories: 90, proteinG: 6, unit: "each", category: "moderate" },
  { keywords: ["omelette", "omelet"], name: "Omelette", calories: 154, proteinG: 11, unit: "serving", category: "moderate" },
  { keywords: ["boiled egg", "boiled eggs", "hard boiled"], name: "Boiled egg", calories: 78, proteinG: 6, unit: "each", category: "healthy" },
  { keywords: ["egg", "eggs"], name: "Egg", calories: 78, proteinG: 6, unit: "each", category: "healthy" },
  { keywords: ["milk"], name: "Milk", calories: 122, proteinG: 8, unit: "cup", category: "healthy" },
  { keywords: ["curd", "yogurt", "yoghurt"], name: "Yogurt/Curd", calories: 100, proteinG: 9, unit: "cup", category: "healthy" },
  { keywords: ["cheese"], name: "Cheese", calories: 113, proteinG: 7, unit: "slice", category: "moderate" },
  { keywords: ["butter"], name: "Butter", calories: 102, proteinG: 0, unit: "tbsp", category: "moderate" },
  { keywords: ["paneer"], name: "Paneer", calories: 265, proteinG: 18, unit: "100g", category: "moderate" },

  // Grains
  { keywords: ["brown rice"], name: "Brown rice", calories: 216, proteinG: 5, unit: "cup", category: "healthy" },
  { keywords: ["white rice", "rice"], name: "Rice", calories: 206, proteinG: 4, unit: "cup", category: "moderate" },
  { keywords: ["oats", "oatmeal", "porridge"], name: "Oats", calories: 150, proteinG: 6, unit: "cup", category: "healthy" },
  { keywords: ["roti", "chapati", "chapatti"], name: "Roti/Chapati", calories: 104, proteinG: 3, unit: "piece", category: "moderate" },
  { keywords: ["paratha"], name: "Paratha", calories: 258, proteinG: 5, unit: "piece", category: "junk" },
  { keywords: ["naan"], name: "Naan", calories: 262, proteinG: 9, unit: "piece", category: "moderate" },
  { keywords: ["toast", "bread"], name: "Toast/Bread", calories: 79, proteinG: 3, unit: "slice", category: "moderate" },
  { keywords: ["cereal", "cornflakes"], name: "Cereal", calories: 130, proteinG: 3, unit: "cup", category: "moderate" },
  { keywords: ["pasta", "spaghetti"], name: "Pasta", calories: 220, proteinG: 8, unit: "cup", category: "moderate" },
  { keywords: ["maggi", "instant noodles"], name: "Instant noodles", calories: 350, proteinG: 7, unit: "pack", category: "junk" },
  { keywords: ["noodles"], name: "Noodles", calories: 220, proteinG: 7, unit: "cup", category: "moderate" },
  { keywords: ["idli"], name: "Idli", calories: 58, proteinG: 2, unit: "piece", category: "healthy" },
  { keywords: ["dosa", "dosai"], name: "Dosa", calories: 168, proteinG: 4, unit: "piece", category: "moderate" },
  { keywords: ["upma"], name: "Upma", calories: 156, proteinG: 4, unit: "serving", category: "healthy" },
  { keywords: ["poha"], name: "Poha", calories: 180, proteinG: 4, unit: "cup", category: "healthy" },

  // Proteins
  { keywords: ["chicken breast", "grilled chicken"], name: "Grilled chicken breast", calories: 165, proteinG: 31, unit: "100g", category: "healthy" },
  { keywords: ["chicken curry", "chicken gravy"], name: "Chicken curry", calories: 280, proteinG: 22, unit: "serving", category: "moderate" },
  { keywords: ["chicken"], name: "Chicken", calories: 239, proteinG: 27, unit: "serving", category: "moderate" },
  { keywords: ["grilled fish"], name: "Grilled fish", calories: 136, proteinG: 26, unit: "100g", category: "healthy" },
  { keywords: ["salmon"], name: "Salmon", calories: 208, proteinG: 25, unit: "100g", category: "healthy" },
  { keywords: ["tuna"], name: "Tuna", calories: 132, proteinG: 29, unit: "100g", category: "healthy" },
  { keywords: ["fish"], name: "Fish", calories: 136, proteinG: 22, unit: "100g", category: "healthy" },
  { keywords: ["beef", "steak", "mutton", "lamb"], name: "Red meat", calories: 250, proteinG: 26, unit: "100g", category: "moderate" },
  { keywords: ["pork"], name: "Pork", calories: 242, proteinG: 27, unit: "100g", category: "moderate" },
  { keywords: ["dal", "lentils", "dhal"], name: "Dal/Lentils", calories: 230, proteinG: 18, unit: "cup", category: "healthy" },
  { keywords: ["tofu"], name: "Tofu", calories: 94, proteinG: 10, unit: "100g", category: "healthy" },
  { keywords: ["chickpeas", "chana"], name: "Chickpeas", calories: 225, proteinG: 15, unit: "cup", category: "healthy" },
  { keywords: ["kidney beans", "beans"], name: "Beans", calories: 225, proteinG: 15, unit: "cup", category: "healthy" },
  { keywords: ["biryani"], name: "Biryani", calories: 450, proteinG: 18, unit: "serving", category: "junk" },

  // Vegetables
  { keywords: ["green salad", "salad"], name: "Green salad", calories: 20, proteinG: 1, unit: "cup", category: "healthy" },
  { keywords: ["mixed veg", "vegetables", "veggies", "sabzi"], name: "Mixed vegetables", calories: 55, proteinG: 2, unit: "cup", category: "healthy" },
  { keywords: ["broccoli"], name: "Broccoli", calories: 31, proteinG: 3, unit: "cup", category: "healthy" },
  { keywords: ["spinach", "palak"], name: "Spinach", calories: 23, proteinG: 3, unit: "cup", category: "healthy" },
  { keywords: ["carrot"], name: "Carrot", calories: 52, proteinG: 1, unit: "medium", category: "healthy" },
  { keywords: ["tomato"], name: "Tomato", calories: 18, proteinG: 1, unit: "medium", category: "healthy" },
  { keywords: ["onion"], name: "Onion", calories: 44, proteinG: 1, unit: "medium", category: "healthy" },
  { keywords: ["french fries", "fries"], name: "French fries", calories: 365, proteinG: 4, unit: "serving", category: "junk" },
  { keywords: ["potato", "potatoes", "aloo"], name: "Potato", calories: 161, proteinG: 4, unit: "medium", category: "moderate" },

  // Fruits
  { keywords: ["apple"], name: "Apple", calories: 95, proteinG: 0, unit: "medium", category: "healthy" },
  { keywords: ["banana"], name: "Banana", calories: 105, proteinG: 1, unit: "medium", category: "healthy" },
  { keywords: ["orange"], name: "Orange", calories: 62, proteinG: 1, unit: "medium", category: "healthy" },
  { keywords: ["mango"], name: "Mango", calories: 201, proteinG: 3, unit: "cup", category: "healthy" },
  { keywords: ["grapes"], name: "Grapes", calories: 104, proteinG: 1, unit: "cup", category: "healthy" },
  { keywords: ["watermelon"], name: "Watermelon", calories: 86, proteinG: 2, unit: "cup", category: "healthy" },
  { keywords: ["strawberries", "strawberry"], name: "Strawberries", calories: 49, proteinG: 1, unit: "cup", category: "healthy" },
  { keywords: ["fruit", "fruits"], name: "Mixed fruit", calories: 75, proteinG: 1, unit: "cup", category: "healthy" },

  // Drinks
  { keywords: ["green tea"], name: "Green tea", calories: 2, proteinG: 0, unit: "cup", category: "healthy" },
  { keywords: ["coffee"], name: "Coffee", calories: 5, proteinG: 0, unit: "cup", category: "healthy" },
  { keywords: ["chai", "tea"], name: "Tea/Chai", calories: 45, proteinG: 1, unit: "cup", category: "moderate" },
  { keywords: ["orange juice", "juice"], name: "Juice", calories: 112, proteinG: 1, unit: "cup", category: "moderate" },
  { keywords: ["protein shake", "protein"], name: "Protein shake", calories: 180, proteinG: 25, unit: "serving", category: "healthy" },
  { keywords: ["smoothie"], name: "Smoothie", calories: 250, proteinG: 5, unit: "glass", category: "moderate" },

  // Junk / snacks
  { keywords: ["burger", "hamburger"], name: "Burger", calories: 354, proteinG: 17, unit: "piece", category: "junk" },
  { keywords: ["pizza"], name: "Pizza", calories: 285, proteinG: 12, unit: "slice", category: "junk" },
  { keywords: ["sandwich"], name: "Sandwich", calories: 300, proteinG: 12, unit: "piece", category: "moderate" },
  { keywords: ["wrap"], name: "Wrap", calories: 290, proteinG: 14, unit: "piece", category: "moderate" },
  { keywords: ["samosa"], name: "Samosa", calories: 252, proteinG: 5, unit: "piece", category: "junk" },
  { keywords: ["pakora", "pakoda"], name: "Pakora", calories: 180, proteinG: 4, unit: "serving", category: "junk" },
  { keywords: ["ice cream"], name: "Ice cream", calories: 207, proteinG: 4, unit: "cup", category: "junk" },
  { keywords: ["cake"], name: "Cake", calories: 235, proteinG: 3, unit: "slice", category: "junk" },
  { keywords: ["donut", "doughnut"], name: "Donut", calories: 253, proteinG: 4, unit: "piece", category: "junk" },
  { keywords: ["chocolate", "candy"], name: "Chocolate", calories: 150, proteinG: 2, unit: "small bar", category: "junk" },
  { keywords: ["chips", "crisps"], name: "Chips/Crisps", calories: 152, proteinG: 2, unit: "small bag", category: "junk" },
  { keywords: ["biscuit", "biscuits", "cookie", "cookies"], name: "Biscuits/Cookies", calories: 150, proteinG: 2, unit: "4 pieces", category: "moderate" },
  { keywords: ["popcorn"], name: "Popcorn", calories: 107, proteinG: 3, unit: "3 cups", category: "moderate" },
  { keywords: ["nuts", "almonds", "cashews"], name: "Nuts", calories: 172, proteinG: 5, unit: "handful", category: "healthy" },
  { keywords: ["peanut butter"], name: "Peanut butter", calories: 188, proteinG: 8, unit: "2 tbsp", category: "moderate" },
];

function parseQuantity(text: string): number {
  const quantityPatterns = [
    { re: /\b(half|1\/2)\b/i, val: 0.5 },
    { re: /\b(quarter|1\/4)\b/i, val: 0.25 },
    { re: /\btwo\b/i, val: 2 },
    { re: /\bthree\b/i, val: 3 },
    { re: /\bfour\b/i, val: 4 },
    { re: /\bfive\b/i, val: 5 },
    { re: /\ba\b|\ban\b/i, val: 1 },
  ];
  for (const { re, val } of quantityPatterns) {
    if (re.test(text)) return val;
  }
  const numMatch = text.match(/\b(\d+(?:\.\d+)?)\s*(?:cups?|pieces?|slices?|servings?|glasses?|packs?)?/i);
  if (numMatch) return parseFloat(numMatch[1]);
  return 1;
}

function classifyMeal(categories: FoodCategory[]): FoodCategory {
  if (categories.length === 0) return "moderate";
  const junkCount = categories.filter((c) => c === "junk").length;
  const healthyCount = categories.filter((c) => c === "healthy").length;
  const ratio = junkCount / categories.length;
  if (ratio >= 0.5) return "junk";
  if (healthyCount / categories.length >= 0.7) return "healthy";
  return "moderate";
}

function estimateFromDescription(description: string): Array<{ food: string; calories: number; proteinG: number; category: FoodCategory }> {
  const lowerDesc = description.toLowerCase();
  const results: Array<{ food: string; calories: number; proteinG: number; category: FoodCategory }> = [];
  const usedRanges: Array<[number, number]> = [];

  const sortedDb = [...FOOD_DB].sort(
    (a, b) =>
      Math.max(...b.keywords.map((k) => k.length)) - Math.max(...a.keywords.map((k) => k.length))
  );

  for (const entry of sortedDb) {
    for (const keyword of entry.keywords) {
      const idx = lowerDesc.indexOf(keyword);
      if (idx === -1) continue;
      const overlaps = usedRanges.some(([s, e]) => idx < e && idx + keyword.length > s);
      if (overlaps) continue;
      const contextBefore = lowerDesc.slice(Math.max(0, idx - 10), idx + keyword.length);
      const qty = parseQuantity(contextBefore);
      results.push({
        food: entry.name,
        calories: Math.round(entry.calories * qty),
        proteinG: Math.round(entry.proteinG * qty),
        category: entry.category,
      });
      usedRanges.push([Math.max(0, idx - 10), idx + keyword.length]);
      break;
    }
  }

  if (results.length === 0 && description.trim().length > 0) {
    results.push({ food: "Unknown food (estimated)", calories: 200, proteinG: 8, category: "moderate" });
  }

  return results;
}

router.post("/calories/estimate", (req, res) => {
  const parsed = EstimateCaloriesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const { foodDescription } = parsed.data;
  const items = estimateFromDescription(foodDescription);
  const estimatedCalories = items.reduce((sum, i) => sum + i.calories, 0);
  const estimatedProteinG = items.reduce((sum, i) => sum + i.proteinG, 0);
  const mealType = classifyMeal(items.map((i) => i.category));

  res.json({ estimatedCalories, estimatedProteinG, mealType, items });
});

export default router;
