import urllib.request
import json

url = "http://127.0.0.1:5000/api/generate-recipe"
payload = json.dumps({
    "ingredients": ["rice", "tomato", "beetroot", "chicken", "mutton", "cauliflower", "bread", "milk", "curd", "beef", "onion", "cheese", "butter", "banana"],
    "cuisine": "South Indian",
    "diet": "No Preference",
    "time": "30 minutes",
    "servings": 2
}).encode("utf-8")

req = urllib.request.Request(url, data=payload, method="POST")
req.add_header("Content-Type", "application/json")

try:
    with urllib.request.urlopen(req, timeout=90) as resp:
        status = resp.status
        body = resp.read().decode("utf-8")
        print("STATUS:", status)
        data = json.loads(body)
        print("SUCCESS:", data.get("success"))
        recipes = data.get("recipes", [])
        print("RECIPES COUNT:", len(recipes))
        if recipes:
            for i, r in enumerate(recipes):
                print(f"\\n--- RECIPE {i+1} ---")
                print(json.dumps(r, indent=2))
except Exception as e:
    print("ERROR:", type(e).__name__, str(e))
