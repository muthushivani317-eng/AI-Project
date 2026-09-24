import sys
import os

# Add the server directory to the python path so it can resolve imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'server'))

from app import app
