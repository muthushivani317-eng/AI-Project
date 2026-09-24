import difflib

# A curated list of common food ingredients. 
# This can be expanded easily.
VALID_INGREDIENTS = {
    # Vegetables
    "tomato", "onion", "potato", "carrot", "garlic", "ginger", "green chilli",
    "spinach", "cabbage", "cauliflower", "broccoli", "capsicum", "bell pepper",
    "peas", "mushroom", "zucchini", "eggplant", "brinjal", "cucumber", "lettuce",
    "sweet potato", "radish", "turnip", "beetroot", "celery", "asparagus",
    "corn", "sweet corn", "green beans", "french beans", "okra", "lady finger",
    "pumpkin", "bottle gourd", "bitter gourd", "ridge gourd", "ash gourd",
    "drumstick", "mint", "coriander", "cilantro", "curry leaves", "fenugreek leaves",
    "spring onion", "leek", "shallot", "artichoke", "brussels sprouts",

    # Fruits
    "apple", "banana", "orange", "grape", "mango", "pineapple", "strawberry",
    "blueberry", "raspberry", "blackberry", "lemon", "lime", "watermelon",
    "melon", "cantaloupe", "peach", "plum", "pear", "cherry", "kiwi", "papaya",
    "pomegranate", "coconut", "avocado", "fig", "date", "apricot", "guava",
    "jackfruit", "lychee", "passion fruit", "dragon fruit", "grapefruit",

    # Proteins & Dairy
    "egg", "chicken", "paneer", "milk", "curd", "yogurt", "cheese", "butter",
    "ghee", "cream", "tofu", "fish", "prawns", "shrimp", "crab", "beef", "pork",
    "lamb", "mutton", "turkey", "duck", "sausage", "bacon", "ham", "salami",
    "soy chunks", "soya chunks", "tempeh", "seitan", "whey", "buttermilk",
    "mozzarella", "cheddar", "parmesan", "feta", "ricotta", "cottage cheese",
    "condensed milk", "evaporated milk",

    # Grains, Pasta & Bread
    "rice", "wheat", "flour", "bread", "pasta", "macaroni", "spaghetti",
    "noodles", "oats", "quinoa", "barley", "millet", "cornmeal", "polenta",
    "couscous", "bulgur", "semolina", "suji", "rava", "poha", "flattened rice",
    "vermicelli", "tortilla", "pita", "naan", "roti", "chapati", "paratha",
    "pizza base", "burger bun", "hot dog bun", "bread crumbs", "baguette",
    "croissant", "brown rice", "basmati rice", "jasmine rice", "wild rice",

    # Lentils, Legumes & Beans
    "dal", "lentils", "moong dal", "toor dal", "masoor dal", "urad dal",
    "chana dal", "chickpeas", "rajma", "kidney beans", "black beans",
    "pinto beans", "soybeans", "black-eyed peas", "green gram", "horse gram",
    "peanuts", "edamame", "cannellini beans", "navy beans", "lima beans",

    # Spices & Condiments
    "salt", "pepper", "black pepper", "sugar", "cumin", "coriander powder",
    "turmeric", "red chilli powder", "garam masala", "mustard seeds", "clove",
    "cinnamon", "cardamom", "bay leaf", "star anise", "nutmeg", "mace",
    "asafoetida", "hing", "fenugreek seeds", "methi", "fennel seeds", "saunf",
    "carom seeds", "ajwain", "poppy seeds", "khus khus", "sesame seeds",
    "oregano", "basil", "thyme", "rosemary", "parsley", "sage", "dill",
    "chives", "tarragon", "paprika", "cayenne", "chilli flakes", "saffron",
    "vanilla", "cocoa powder", "baking powder", "baking soda", "yeast",
    "vinegar", "apple cider vinegar", "soy sauce", "ketchup", "tomato paste",
    "tomato puree", "mayonnaise", "mustard", "hot sauce", "sriracha", "bbq sauce",
    "fish sauce", "oyster sauce", "hoisin sauce", "sesame oil", "olive oil",
    "vegetable oil", "canola oil", "sunflower oil", "peanut oil", "coconut oil",
    "mustard oil", "honey", "maple syrup", "jaggery", "brown sugar",

    # Nuts & Seeds
    "almond", "cashew", "walnut", "pistachio", "pecan", "macadamia", "hazelnut",
    "pine nut", "brazil nut", "chia seeds", "flax seeds", "pumpkin seeds",
    "sunflower seeds", "melon seeds",

    # Liquids & Others
    "water", "broth", "chicken broth", "vegetable broth", "beef broth",
    "stock", "chicken stock", "vegetable stock", "beef stock", "wine",
    "red wine", "white wine", "beer", "rum", "vodka", "bourbon", "coffee",
    "tea", "green tea", "black tea", "matcha", "chocolate", "dark chocolate",
    "white chocolate", "marshmallow", "gelatin", "agar agar",

    # Mixed words user might type
    "green chili", "red chili", "chili", "chilly", "chillies", "chilli",
    "coriander leaves", "mint leaves", "curry powder", "taco seasoning",
    "cajun seasoning", "italian seasoning", "mixed herbs", "garlic powder",
    "onion powder", "ginger paste", "garlic paste", "ginger garlic paste"
}

def validate_ingredients(ingredient_list):
    """
    Validates a list of ingredients.
    Returns a dict with:
    {
        "valid": [...],
        "invalid": [...],
        "suggestions": { "misspelled_word": "suggestion", ... }
    }
    """
    result = {
        "valid": [],
        "invalid": [],
        "suggestions": {}
    }

    if not ingredient_list:
        return result

    for item in ingredient_list:
        # Normalize: lowercase and strip spaces
        clean_item = item.strip().lower()
        
        if clean_item in VALID_INGREDIENTS:
            result["valid"].append(item.strip())
        else:
            # Check for close matches (fuzzy matching)
            # cutoff=0.7 is a reasonable threshold for similarity
            matches = difflib.get_close_matches(clean_item, VALID_INGREDIENTS, n=1, cutoff=0.7)
            
            if matches:
                # We found a possible spelling mistake
                # Example: "Tomatto" -> matches ["tomato"]
                # Capitalize the suggestion for better UI display
                suggestion = matches[0].title()
                result["suggestions"][item.strip()] = suggestion
            else:
                # Truly invalid / not recognized
                result["invalid"].append(item.strip())

    return result
