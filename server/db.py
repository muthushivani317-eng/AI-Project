import os
import sqlite3
from datetime import datetime

# Vercel / Neon might use different environment variable names
DATABASE_URL = os.environ.get('DATABASE_URL') or os.environ.get('POSTGRES_URL') or os.environ.get('NEON_DATABASE_URL')

if DATABASE_URL:
    import psycopg2
    from psycopg2.extras import RealDictCursor

def get_connection():
    if DATABASE_URL:
        return psycopg2.connect(DATABASE_URL)
    else:
        # Vercel environment is read-only except for /tmp
        db_path = "/tmp/recipes.db" if os.environ.get('VERCEL') else "recipes.db"
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    
    if DATABASE_URL:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS recipes (
                id SERIAL PRIMARY KEY,
                ingredients TEXT NOT NULL,
                recipe_content TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS favorites (
                id SERIAL PRIMARY KEY,
                recipe_name TEXT NOT NULL,
                recipe_content TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS shopping_list (
                id SERIAL PRIMARY KEY,
                item_name TEXT NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TEXT NOT NULL
            )
        ''')
    else:
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS recipes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ingredients TEXT NOT NULL,
                recipe_content TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipe_name TEXT NOT NULL,
                recipe_content TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS shopping_list (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                item_name TEXT NOT NULL,
                completed BOOLEAN NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
        ''')
    conn.commit()
    conn.close()

def _exec(query, params=()):
    conn = get_connection()
    if DATABASE_URL:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = query.replace('?', '%s')
    else:
        cursor = conn.cursor()
    
    cursor.execute(query, params)
    conn.commit()
    last_id = cursor.lastrowid if not DATABASE_URL else None
    conn.close()
    return last_id

def _fetch(query, params=()):
    conn = get_connection()
    if DATABASE_URL:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        query = query.replace('?', '%s')
    else:
        cursor = conn.cursor()
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def save_recipe(ingredients, recipe_content):
    created_at = datetime.now().isoformat()
    _exec('INSERT INTO recipes (ingredients, recipe_content, created_at) VALUES (?, ?, ?)', 
          (ingredients, recipe_content, created_at))

def get_recent_recipes(limit=20):
    return _fetch('SELECT * FROM recipes ORDER BY created_at DESC LIMIT ?', (limit,))

def remove_recipe(recipe_id):
    _exec('DELETE FROM recipes WHERE id = ?', (recipe_id,))

def save_favorite(recipe_name, recipe_content):
    created_at = datetime.now().isoformat()
    conn = get_connection()
    if DATABASE_URL:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        cursor.execute('INSERT INTO favorites (recipe_name, recipe_content, created_at) VALUES (%s, %s, %s) RETURNING id', 
                      (recipe_name, recipe_content, created_at))
        recipe_id = cursor.fetchone()['id']
    else:
        cursor = conn.cursor()
        cursor.execute('INSERT INTO favorites (recipe_name, recipe_content, created_at) VALUES (?, ?, ?)', 
                      (recipe_name, recipe_content, created_at))
        recipe_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return recipe_id

def get_favorites():
    return _fetch('SELECT * FROM favorites ORDER BY created_at DESC')

def remove_favorite(recipe_id):
    _exec('DELETE FROM favorites WHERE id = ?', (recipe_id,))

def add_to_shopping_list(items):
    conn = get_connection()
    if DATABASE_URL:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
    else:
        cursor = conn.cursor()
    
    created_at = datetime.now().isoformat()
    for item in items:
        q = 'SELECT id FROM shopping_list WHERE item_name = %s AND completed = FALSE' if DATABASE_URL else 'SELECT id FROM shopping_list WHERE item_name = ? AND completed = 0'
        cursor.execute(q, (item,))
        if not cursor.fetchone():
            ins_q = 'INSERT INTO shopping_list (item_name, completed, created_at) VALUES (%s, FALSE, %s)' if DATABASE_URL else 'INSERT INTO shopping_list (item_name, completed, created_at) VALUES (?, 0, ?)'
            cursor.execute(ins_q, (item, created_at))
    
    conn.commit()
    conn.close()

def get_shopping_list():
    return _fetch('SELECT * FROM shopping_list ORDER BY created_at DESC')

def remove_from_shopping_list(item_id):
    _exec('DELETE FROM shopping_list WHERE id = ?', (item_id,))

def toggle_shopping_list_item(item_id, completed):
    if DATABASE_URL:
        _exec('UPDATE shopping_list SET completed = ? WHERE id = ?', (completed, item_id))
    else:
        _exec('UPDATE shopping_list SET completed = ? WHERE id = ?', (1 if completed else 0, item_id))

def clear_shopping_list():
    _exec('DELETE FROM shopping_list')
