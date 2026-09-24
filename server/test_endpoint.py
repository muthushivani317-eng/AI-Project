import requests
import time

url = "http://127.0.0.1:5000/api/generate-recipe"
payload = {
    "ingredients": ["Chicken", "Onion", "Tomato"],
    "cuisine": "South Indian",
    "diet": "Non-Vegetarian",
    "time": "30 minutes",
    "servings": 2
}

start = time.time()
try:
    response = requests.post(url, json=payload, timeout=180) # 3 min timeout
    elapsed = time.time() - start
    print(f"Status Code: {response.status_code}")
    print(f"Time Taken: {elapsed:.2f} seconds")
    try:
        print("Response JSON:", response.json())
    except:
        print("Response Text:", response.text)
except requests.exceptions.Timeout:
    elapsed = time.time() - start
    print(f"Request timed out locally after {elapsed:.2f} seconds")
except Exception as e:
    print("Error:", e)
