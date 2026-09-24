import sqlite3
from datetime import datetime

DB_NAME = "recipes.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
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

def save_recipe(ingredients, recipe_content):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()
    cursor.execute('''
        INSERT INTO recipes (ingredients, recipe_content, created_at)
        VALUES (?, ?, ?)
    ''', (ingredients, recipe_content, created_at))
    conn.commit()
    conn.close()

def get_recent_recipes(limit=20):
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM recipes ORDER BY created_at DESC LIMIT ?
    ''', (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def remove_recipe(recipe_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM recipes WHERE id = ?', (recipe_id,))
    conn.commit()
    conn.close()

def save_favorite(recipe_name, recipe_content):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()
    cursor.execute('''
        INSERT INTO favorites (recipe_name, recipe_content, created_at)
        VALUES (?, ?, ?)
    ''', (recipe_name, recipe_content, created_at))
    recipe_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return recipe_id

def get_favorites():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM favorites ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def remove_favorite(recipe_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM favorites WHERE id = ?', (recipe_id,))
    conn.commit()
    conn.close()

def add_to_shopping_list(items):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    created_at = datetime.now().isoformat()
    for item in items:
        # Check if already exists and not completed
        cursor.execute('SELECT id FROM shopping_list WHERE item_name = ? AND completed = 0', (item,))
        if not cursor.fetchone():
            cursor.execute('''
                INSERT INTO shopping_list (item_name, completed, created_at)
                VALUES (?, 0, ?)
            ''', (item, created_at))
    conn.commit()
    conn.close()

def get_shopping_list():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM shopping_list ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def remove_from_shopping_list(item_id):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM shopping_list WHERE id = ?', (item_id,))
    conn.commit()
    conn.close()

def toggle_shopping_list_item(item_id, completed):
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('UPDATE shopping_list SET completed = ? WHERE id = ?', (1 if completed else 0, item_id))
    conn.commit()
    conn.close()

def clear_shopping_list():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute('DELETE FROM shopping_list')
    conn.commit()
    conn.close()
