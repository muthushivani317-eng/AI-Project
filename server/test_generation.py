import sys
import json
from dotenv import load_dotenv
load_dotenv()
from ai_service import generate_recipe

res = generate_recipe(
    ingredients=["Chicken", "Onion", "Tomato"],
    cuisine="South Indian"
)

print(json.dumps(res, indent=2))
