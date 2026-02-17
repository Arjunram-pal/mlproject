#!/usr/bin/env python3
"""Script to view all posts and replies from the SQLite database"""

import sqlite3

DB_PATH = "routine.db"


def view_database() -> None:
    """Display all posts and replies from the database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, message, timestamp FROM posts ORDER BY id DESC')
    posts = cursor.fetchall()
    
    print("\n" + "="*80)
    print("📝 DAILY ROUTINE DATABASE")
    print("="*80 + "\n")
    
    if not posts:
        print("❌ No posts found in database\n")
        conn.close()
        return
    
    print(f"✅ Total Posts: {len(posts)}\n")
    
    for post in posts:
        print(f"POST #{post['id']}")
        print(f"  Message: {post['message']}")
        print(f"  Time: {post['timestamp']}")
        
        cursor.execute('SELECT id, message, timestamp FROM replies WHERE post_id = ? ORDER BY id ASC', (post['id'],))
        replies = cursor.fetchall()
        
        if replies:
            print(f"  Replies ({len(replies)}):")
            for reply in replies:
                print(f"    - [{reply['id']}] {reply['message']}")
                print(f"      Time: {reply['timestamp']}")
        else:
            print("  Replies: None")
        
        print()
    
    conn.close()
    print("="*80 + "\n")


if __name__ == "__main__":
    view_database()
