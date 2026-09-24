from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from db import (
    init_db, save_recipe, get_recent_recipes, remove_recipe,
    save_favorite, get_favorites, remove_favorite,
    add_to_shopping_list, get_shopping_list, remove_from_shopping_list,
    toggle_shopping_list_item, clear_shopping_list
)
from ai_service import generate_recipe
from ingredient_validator import validate_ingredients
import json
import os

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {
    "origins": [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    "methods": ["GET", "POST", "DELETE", "PATCH", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})
init_db()

import logging

@app.route('/api/validate-ingredients', methods=['POST'])
def validate():
    data = request.json or {}
    raw_ingredients = data.get('ingredients', [])
    
    if not isinstance(raw_ingredients, list) or not raw_ingredients:
        return jsonify({"success": False, "error": "Please provide at least one ingredient."}), 400
    
    ingredients = []
    for item in raw_ingredients:
        if isinstance(item, str):
            item_clean = item.strip()
            # case-insensitive deduplication for validation
            if item_clean and not any(i.lower() == item_clean.lower() for i in ingredients):
                ingredients.append(item_clean)
                
    if not ingredients:
        return jsonify({"success": False, "error": "Please provide at least one ingredient."}), 400
        
    validation_result = validate_ingredients(ingredients)
    
    return jsonify({
        "success": True, 
        "validation": validation_result
    }), 200

@app.route('/api/generate-recipe', methods=['POST'])
def generate():
    app.logger.info("[BACKEND] Recipe request received")
    
    data = request.json or {}
    raw_ingredients = data.get('ingredients', [])
    cuisine = data.get('cuisine', 'Any')
    diet = data.get('diet', 'No Preference')
    time = data.get('time', 'Any')
    servings = data.get('servings', 1)
    
    if not isinstance(raw_ingredients, list):
        app.logger.error("[BACKEND ERROR] Ingredients is not a list")
        return jsonify({"success": False, "error": "Please provide at least one ingredient."}), 400
        
    ingredients = []
    for item in raw_ingredients:
        if isinstance(item, str):
            item_clean = item.strip()
            if item_clean and item_clean not in ingredients:
                ingredients.append(item_clean)
                
    if not ingredients:
        app.logger.error("[BACKEND ERROR] No ingredients provided")
        return jsonify({"success": False, "error": "Please provide at least one ingredient."}), 400
        
    validation_result = validate_ingredients(ingredients)
    if validation_result["invalid"]:
        invalid_item = validation_result["invalid"][0]
        return jsonify({
            "success": False,
            "error": "INVALID_INGREDIENT",
            "message": f"'{invalid_item}' is not a recognized food ingredient."
        }), 400
        
    if validation_result["suggestions"]:
        misspelled = list(validation_result["suggestions"].keys())[0]
        suggestion = validation_result["suggestions"][misspelled]
        return jsonify({
            "success": False,
            "error": "POSSIBLE_SPELLING_MISTAKE",
            "message": f"Did you mean '{suggestion}'?",
            "suggestion": suggestion
        }), 400
        
    app.logger.info(f"[BACKEND] Ingredients: {ingredients}")
    app.logger.info(f"[BACKEND] Cuisine: {cuisine}")
    app.logger.info(f"[BACKEND] Diet: {diet}")
    app.logger.info(f"[BACKEND] Time: {time}")
    app.logger.info(f"[BACKEND] Servings: {servings}")
    app.logger.info("[BACKEND] Calling Gemini...")
    
    ingredients_str = ", ".join(ingredients)
    
    try:
        recipe_data = generate_recipe(ingredients_str, cuisine, diet, time, servings)
        app.logger.info("[BACKEND] Gemini response received")
    except Exception as e:
        app.logger.error(f"[BACKEND ERROR] {str(e)}")
        return jsonify({"success": False, "error": "Unexpected server error"}), 500
    
    app.logger.info("[BACKEND] Parsing recipe JSON...")
    
    if "error" in recipe_data:
        app.logger.error(f"[BACKEND ERROR] {recipe_data['error']}")
        if "temporarily busy" in recipe_data["error"] or "rate-limited" in recipe_data["error"]:
            return jsonify({"success": False, "error": "AI service is temporarily rate-limited. Please wait a moment and try again."}), 429
        return jsonify({"success": False, "error": "AI returned an invalid recipe response."}), 502
        
    recipes = recipe_data.get("recipes", [])
    if not recipes:
        app.logger.error("[BACKEND ERROR] No recipes in parsed JSON")
        return jsonify({"success": False, "error": "AI returned an invalid recipe response."}), 502
        
    app.logger.info("[BACKEND] JSON parsing successful")
    app.logger.info(f"[BACKEND] Recipes generated: {len(recipes)}")
    app.logger.info("[BACKEND] Sending response...")
    
    # Save to history (saving first recipe for now)
    save_recipe(ingredients_str, json.dumps(recipes[0]))
        
    return jsonify({"success": True, "recipes": recipes}), 200

@app.route('/api/history', methods=['GET'])
def history():
    # increase limit slightly to support pagination fallback on frontend
    recipes = get_recent_recipes(limit=100)
    return jsonify({"history": recipes})

@app.route('/api/history/<int:recipe_id>', methods=['DELETE'])
def handle_remove_history(recipe_id):
    remove_recipe(recipe_id)
    return jsonify({"success": True})

@app.route('/api/favorites', methods=['GET', 'POST'])
def handle_favorites():
    if request.method == 'POST':
        data = request.json
        recipe_name = data.get('recipe_name')
        recipe_content = data.get('recipe_content')
        if not recipe_name or not recipe_content:
            return jsonify({"error": "Missing recipe data"}), 400
        recipe_id = save_favorite(recipe_name, recipe_content)
        return jsonify({"success": True, "id": recipe_id})
    else:
        favorites = get_favorites()
        return jsonify({"favorites": favorites})

@app.route('/api/favorites/<int:recipe_id>', methods=['DELETE'])
def handle_remove_favorite(recipe_id):
    remove_favorite(recipe_id)
    return jsonify({"success": True})

@app.route('/api/shopping-list', methods=['GET', 'POST', 'DELETE'])
def handle_shopping_list():
    if request.method == 'POST':
        data = request.json
        items = data.get('items', [])
        if not items:
            return jsonify({"error": "No items provided"}), 400
        add_to_shopping_list(items)
        return jsonify({"success": True})
    elif request.method == 'DELETE':
        clear_shopping_list()
        return jsonify({"success": True})
    else:
        items = get_shopping_list()
        return jsonify({"items": items})

@app.route('/api/shopping-list/<int:item_id>', methods=['DELETE', 'PATCH'])
def handle_shopping_list_item(item_id):
    if request.method == 'DELETE':
        remove_from_shopping_list(item_id)
        return jsonify({"success": True})
    elif request.method == 'PATCH':
        data = request.json
        completed = data.get('completed', False)
        toggle_shopping_list_item(item_id, completed)
        return jsonify({"success": True})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
