import { Router } from "express";
import { EstimateCaloriesBody } from "@workspace/api-zod";

const router = Router();

// Calorie database: food name → calories per standard serving
const FOOD_DB: Array<{ keywords: string[]; name: string; calories: number; unit: string }> = [
  // Eggs & dairy
  { keywords: ["egg", "eggs"], name: "Egg", calories: 78, unit: "each" },
  { keywords: ["scrambled egg", "scrambled eggs"], name: "Scrambled eggs", calories: 91, unit: "serving" },
  { keywords: ["fried egg", "fried eggs"], name: "Fried egg", calories: 90, unit: "each" },
  { keywords: ["omelette", "omelet"], name: "Omelette", calories: 154, unit: "serving" },
  { keywords: ["boiled egg", "boiled eggs", "hard boiled"], name: "Boiled egg", calories: 78, unit: "each" },
  { keywords: ["milk"], name: "Milk", calories: 122, unit: "cup" },
  { keywords: ["cheese"], name: "Cheese", calories: 113, unit: "slice" },
  { keywords: ["butter"], name: "Butter", calories: 102, unit: "tbsp" },
  { keywords: ["yogurt", "yoghurt", "curd"], name: "Yogurt", calories: 100, unit: "cup" },

  // Bread & grains
  { keywords: ["toast", "bread"], name: "Toast/Bread", calories: 79, unit: "slice" },
  { keywords: ["white rice", "rice"], name: "Rice", calories: 206, unit: "cup" },
  { keywords: ["brown rice"], name: "Brown rice", calories: 216, unit: "cup" },
  { keywords: ["roti", "chapati", "chapatti"], name: "Roti/Chapati", calories: 104, unit: "piece" },
  { keywords: ["naan"], name: "Naan", calories: 262, unit: "piece" },
  { keywords: ["paratha"], name: "Paratha", calories: 258, unit: "piece" },
  { keywords: ["oats", "oatmeal", "porridge"], name: "Oats", calories: 150, unit: "cup" },
  { keywords: ["cereal", "cornflakes"], name: "Cereal", calories: 130, unit: "cup" },
  { keywords: ["pasta", "noodles", "spaghetti"], name: "Pasta", calories: 220, unit: "cup" },
  { keywords: ["sandwich"], name: "Sandwich", calories: 300, unit: "piece" },
  { keywords: ["burger", "hamburger"], name: "Burger", calories: 354, unit: "piece" },
  { keywords: ["pizza"], name: "Pizza", calories: 285, unit: "slice" },
  { keywords: ["wrap"], name: "Wrap", calories: 290, unit: "piece" },

  // Proteins
  { keywords: ["chicken breast", "grilled chicken"], name: "Chicken breast", calories: 165, unit: "100g" },
  { keywords: ["chicken", "chicken curry", "chicken gravy"], name: "Chicken", calories: 239, unit: "serving" },
  { keywords: ["fish", "grilled fish"], name: "Fish", calories: 136, unit: "100g" },
  { keywords: ["salmon"], name: "Salmon", calories: 208, unit: "100g" },
  { keywords: ["tuna"], name: "Tuna", calories: 132, unit: "100g" },
  { keywords: ["beef", "steak", "mutton", "lamb"], name: "Red meat", calories: 250, unit: "100g" },
  { keywords: ["pork"], name: "Pork", calories: 242, unit: "100g" },
  { keywords: ["dal", "lentils", "dhal"], name: "Dal/Lentils", calories: 230, unit: "cup" },
  { keywords: ["tofu"], name: "Tofu", calories: 94, unit: "100g" },
  { keywords: ["beans", "kidney beans", "chickpeas", "chana"], name: "Beans/Legumes", calories: 225, unit: "cup" },
  { keywords: ["paneer"], name: "Paneer", calories: 265, unit: "100g" },

  // Vegetables
  { keywords: ["salad", "green salad"], name: "Green salad", calories: 20, unit: "cup" },
  { keywords: ["vegetables", "veggies", "mixed veg", "sabzi"], name: "Mixed vegetables", calories: 55, unit: "cup" },
  { keywords: ["broccoli"], name: "Broccoli", calories: 31, unit: "cup" },
  { keywords: ["spinach", "palak"], name: "Spinach", calories: 23, unit: "cup" },
  { keywords: ["potato", "potatoes", "aloo"], name: "Potato", calories: 161, unit: "medium" },
  { keywords: ["french fries", "chips", "fries"], name: "French fries", calories: 365, unit: "medium serving" },
  { keywords: ["carrot"], name: "Carrot", calories: 52, unit: "medium" },
  { keywords: ["tomato"], name: "Tomato", calories: 18, unit: "medium" },
  { keywords: ["onion"], name: "Onion", calories: 44, unit: "medium" },

  // Fruits
  { keywords: ["apple"], name: "Apple", calories: 95, unit: "medium" },
  { keywords: ["banana"], name: "Banana", calories: 105, unit: "medium" },
  { keywords: ["orange"], name: "Orange", calories: 62, unit: "medium" },
  { keywords: ["mango"], name: "Mango", calories: 201, unit: "cup" },
  { keywords: ["grapes"], name: "Grapes", calories: 104, unit: "cup" },
  { keywords: ["watermelon"], name: "Watermelon", calories: 86, unit: "cup" },
  { keywords: ["strawberries", "strawberry"], name: "Strawberries", calories: 49, unit: "cup" },
  { keywords: ["fruit", "fruits"], name: "Mixed fruit", calories: 75, unit: "cup" },

  // Drinks
  { keywords: ["orange juice", "juice"], name: "Juice", calories: 112, unit: "cup" },
  { keywords: ["coffee"], name: "Coffee", calories: 5, unit: "cup" },
  { keywords: ["tea", "chai"], name: "Tea/Chai", calories: 45, unit: "cup" },
  { keywords: ["green tea"], name: "Green tea", calories: 2, unit: "cup" },
  { keywords: ["smoothie"], name: "Smoothie", calories: 250, unit: "glass" },
  { keywords: ["protein shake", "protein"], name: "Protein shake", calories: 180, unit: "serving" },

  // Snacks & junk
  { keywords: ["biscuit", "biscuits", "cookie", "cookies"], name: "Biscuits/Cookies", calories: 150, unit: "4 pieces" },
  { keywords: ["chocolate", "candy"], name: "Chocolate", calories: 150, unit: "small bar" },
  { keywords: ["samosa"], name: "Samosa", calories: 252, unit: "piece" },
  { keywords: ["pakora", "pakoda"], name: "Pakora", calories: 180, unit: "serving" },
  { keywords: ["ice cream"], name: "Ice cream", calories: 207, unit: "cup" },
  { keywords: ["cake"], name: "Cake", calories: 235, unit: "slice" },
  { keywords: ["donut", "doughnut"], name: "Donut", calories: 253, unit: "piece" },
  { keywords: ["chips", "crisps"], name: "Chips/Crisps", calories: 152, unit: "small bag" },
  { keywords: ["popcorn"], name: "Popcorn", calories: 107, unit: "3 cups" },
  { keywords: ["nuts", "almonds", "cashews"], name: "Nuts", calories: 172, unit: "handful" },
  { keywords: ["peanut butter"], name: "Peanut butter", calories: 188, unit: "2 tbsp" },
  { keywords: ["idli"], name: "Idli", calories: 58, unit: "piece" },
  { keywords: ["dosa", "dosai"], name: "Dosa", calories: 168, unit: "piece" },
  { keywords: ["upma"], name: "Upma", calories: 156, unit: "serving" },
  { keywords: ["poha"], name: "Poha", calories: 180, unit: "cup" },
  { keywords: ["biryani"], name: "Biryani", calories: 450, unit: "serving" },
  { keywords: ["pizza slice"], name: "Pizza", calories: 285, unit: "slice" },
  { keywords: ["maggi", "instant noodles"], name: "Maggi/Instant noodles", calories: 350, unit: "pack" },
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

function estimateFromDescription(description: string): Array<{ food: string; calories: number }> {
  const lowerDesc = description.toLowerCase();
  const results: Array<{ food: string; calories: number }> = [];
  const usedRanges: Array<[number, number]> = [];

  // Sort by keyword length descending (prefer longer matches)
  const sortedDb = [...FOOD_DB].sort(
    (a, b) =>
      Math.max(...b.keywords.map((k) => k.length)) - Math.max(...a.keywords.map((k) => k.length))
  );

  for (const entry of sortedDb) {
    for (const keyword of entry.keywords) {
      const idx = lowerDesc.indexOf(keyword);
      if (idx === -1) continue;

      // Check overlap with already-matched ranges
      const overlaps = usedRanges.some(([s, e]) => idx < e && idx + keyword.length > s);
      if (overlaps) continue;

      // Look for a quantity before the keyword (up to 10 chars back)
      const contextBefore = lowerDesc.slice(Math.max(0, idx - 10), idx + keyword.length);
      const qty = parseQuantity(contextBefore);

      results.push({ food: entry.name, calories: Math.round(entry.calories * qty) });
      usedRanges.push([Math.max(0, idx - 10), idx + keyword.length]);
      break; // Only match each DB entry once
    }
  }

  // If nothing recognized but description is non-empty, give a rough estimate
  if (results.length === 0 && description.trim().length > 0) {
    results.push({ food: "Unknown food (estimated)", calories: 200 });
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

  res.json({ estimatedCalories, items });
});

export default router;
