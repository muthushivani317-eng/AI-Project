import os
import json
import logging
import google.generativeai as genai
from google.generativeai.types import content_types

def generate_recipe(ingredients, cuisine="Any", diet="No Preference", time="Any", servings=1):
    api_key = os.environ.get("AI_API_KEY")
    if not api_key:
        return {"error": "AI API key is missing."}
    
    try:
        import logging
        genai.configure(api_key=api_key)
        # Using gemini-3.5-flash as the primary fast model
        model = genai.GenerativeModel('gemini-3.5-flash')
        prompt = f"""
Act as an expert chef. You are building an AI-Powered Pantry-to-Plate Recipe Assistant.
Create EXACTLY 3 distinct, realistic, and cookable recipes based on the following inputs:
- Available Ingredients (Pantry): {ingredients}
- Cuisine: {cuisine}
- Dietary Preference: {diet}
- Cooking Time: {time}
- Servings: {servings}

IMPORTANT INSTRUCTIONS:
1. DO NOT force all pantry ingredients into one recipe. Intelligently select a compatible subset for each recipe (e.g. Chicken + Rice + Tomato -> Chicken Tomato Rice).
2. Generate EXACTLY 3 genuinely DIFFERENT recipes using different combinations of the available ingredients. Do not create identical recipes.
3. Identify all essential spices, masalas, seasonings, and cooking powders required for this specific recipe. Select them based on the recipe type, cuisine, ingredients, and cooking method. Do not add unnecessary spices. If a required spice is not present in the user's available ingredients, place it in missing_ingredients with an appropriate quantity. If it is already available, include it in available_ingredients and use it in the cooking steps.
4. The "available_ingredients" MUST contain ONLY the ingredients from the user's pantry that are ACTUALLY used in the recipe. If an ingredient is not used, DO NOT list it.
5. The "missing_ingredients" MUST contain ONLY ingredients genuinely required to complete the recipe that are NOT in the pantry. Do not mark a pantry ingredient as missing.
6. Provide realistic quantities for ALL ingredients (e.g., "1 cup", "2 medium", "1 tbsp"). Do not use vague quantities like "some" or "as needed".
7. Provide MUCH MORE DETAILED COOKING STEPS. A normal recipe should have 7-10 steps; a simple one 5-7 steps. Each step must explain an actual cooking action in logical sequence.
8. WRITE ALL COOKING STEPS IN VERY SIMPLE, EVERYDAY ENGLISH. Use short sentences and avoid complex culinary jargon or advanced vocabulary. A beginner cook must be able to easily understand every word.
9. When a spice/masala is required, the step MUST clearly tell the user when and how to add it, using the exact quantities specified in the ingredients list.
10. The "servings" field MUST be a numeric value exactly matching {servings}.
11. The "time_minutes" field MUST be a numeric value respecting the requested Cooking Time ({time}).
12. The "cuisine" and "dietary preference" MUST be strictly respected. (If Vegetarian, NO meat/egg. If South Indian, use South Indian style/spices).
13. The "description" should be a useful 1-2 sentence explanation of the dish, also written in simple English.
14. Provide one useful cooking tip for every recipe.

Provide the output strictly in the following JSON format. RETURN ONLY VALID JSON without any markdown formatting blocks like ```json. Do NOT provide any explanation before or after the JSON.

{{
  "recipes": [
    {{
      "title": "Recipe Name",
      "description": "Short description",
      "time_minutes": 25,
      "servings": 2,
      "difficulty": "Easy",
      "available_ingredients": [
        {{
          "name": "Rice",
          "quantity": "1 cup"
        }}
      ],
      "missing_ingredients": [
        {{
          "name": "Garlic",
          "quantity": "4 cloves"
        }}
      ],
      "steps": [
        "Step 1...",
        "Step 2...",
        "Step 3...",
        "Step 4...",
        "Step 5..."
      ],
      "tip": "Useful cooking tip"
    }}
  ]
}}
"""
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        try:
            if hasattr(response, 'usage_metadata') and response.usage_metadata:
                usage = response.usage_metadata
                print("\n========== GEMINI TOKEN USAGE ==========", flush=True)
                print(f"Prompt/Input Tokens: {getattr(usage, 'prompt_token_count', 'Unknown')}", flush=True)
                print(f"Output Tokens: {getattr(usage, 'candidates_token_count', 'Unknown')}", flush=True)
                print(f"Total Tokens: {getattr(usage, 'total_token_count', 'Unknown')}", flush=True)
                print("=========================================\n", flush=True)
        except Exception as e:
            print(f"Failed to extract token usage: {e}", flush=True)
            
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
        if text.startswith("```"):
            text = text[3:]
        
        parsed_data = json.loads(text.strip())
        
        # Validation
        if not isinstance(parsed_data, dict) or "recipes" not in parsed_data:
            return {"error": "Invalid JSON: 'recipes' key missing"}
            
        recipes = parsed_data.get("recipes", [])
        if not isinstance(recipes, list):
            return {"error": "Invalid JSON: 'recipes' must be an array"}
            
        if len(recipes) == 0:
            return {"error": "Invalid JSON: expected at least 1 recipe, got 0"}
            
        required_keys = ["title", "description", "time_minutes", "servings", "difficulty", 
                         "available_ingredients", "missing_ingredients", "steps", "tip"]
                         
        for r in recipes:
            for key in required_keys:
                if key not in r:
                    return {"error": f"Invalid JSON: missing required key '{key}' in recipe"}
            
            if not isinstance(r.get("time_minutes"), (int, float)):
                return {"error": "Invalid JSON: time_minutes must be numeric"}
                
            if not isinstance(r.get("servings"), (int, float)):
                return {"error": "Invalid JSON: servings must be numeric"}
                
            steps = r.get("steps", [])
            if not isinstance(steps, list):
                return {"error": "Invalid JSON: steps must be an array"}
                
            if len(steps) < 5:
                return {"error": "Invalid JSON: steps must contain at least 5 items"}
                
            # Map object ingredients to strings to maintain frontend compatibility
            for key in ["available_ingredients", "missing_ingredients"]:
                mapped_items = []
                for item in r.get(key, []):
                    if isinstance(item, dict):
                        name = item.get("name", "").strip()
                        qty = item.get("quantity", "").strip()
                        if name and qty:
                            mapped_items.append(f"{qty} {name}")
                        elif name:
                            mapped_items.append(name)
                    else:
                        mapped_items.append(str(item))
                r[key] = mapped_items
                
        return parsed_data
        
    except json.JSONDecodeError as e:
        logging.error(f"JSON Decode Error: {e} Raw text: {text}")
        return {"error": "AI returned malformed JSON."}
    except Exception as e:
        error_msg = str(e)
        logging.error(f"General Exception in generate_recipe: {error_msg}")
        if "429" in error_msg:
            return {"error": "AI is temporarily busy. Please wait a moment and try again."}
        return {"error": f"AI generation failed: {error_msg}"}
