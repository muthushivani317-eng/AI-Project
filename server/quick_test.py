import os, json
from dotenv import load_dotenv
load_dotenv()
import google.generativeai as genai

api_key = os.environ.get('AI_API_KEY')
print('API KEY SET:', bool(api_key))
if api_key:
    print('KEY PREFIX:', api_key[:8])

genai.configure(api_key=api_key)
model = genai.GenerativeModel('gemini-3.6-flash')

try:
    resp = model.generate_content('Return this exact JSON without any markdown: {"message": "HELLO"}')
    print('RAW RESPONSE:', resp.text[:300])
    print('SUCCESS')
except Exception as e:
    print('MODEL ERROR:', type(e).__name__, str(e)[:300])
