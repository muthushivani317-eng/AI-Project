import os
import google.generativeai as genai
from dotenv import load_dotenv
from google.api_core.exceptions import GoogleAPIError

load_dotenv()
genai.configure(api_key=os.environ.get('AI_API_KEY'))

model = genai.GenerativeModel('gemini-3.8-flash')
try:
    response = model.generate_content('test')
    print('Success')
except GoogleAPIError as e:
    print('--- GoogleAPIError ---')
    print(f'Message: {e.message}')
    print(f'Code: {e.code}')
    print(f'Errors: {e.errors}')
    print(f'Response: {e.response}')
except Exception as e:
    print('--- Other Error ---')
    print(e)
