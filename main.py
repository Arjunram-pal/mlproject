from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from datetime import datetime
import os
import sqlite3
from typing import List, Dict, Any
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

app = FastAPI()
DB_PATH = "routine.db"

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


class Post(BaseModel):
    message: str


class Reply(BaseModel):
    message: str


class ContactMessage(BaseModel):
    fullname: str
    email: str
    message: str


class BlogPost(BaseModel):
    title: str
    category: str
    content: str


def init_db() -> None:
    """Initialize the database with tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS replies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            post_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            FOREIGN KEY (post_id) REFERENCES posts(id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS blogs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()


def get_posts_from_db() -> List[Dict[str, Any]]:
    """Fetch all posts with replies from database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, message, timestamp FROM posts ORDER BY id DESC')
    posts = cursor.fetchall()
    
    posts_list = []
    for post in posts:
        post_dict = dict(post)
        cursor.execute(
            'SELECT id, message, timestamp FROM replies WHERE post_id = ? ORDER BY id ASC',
            (post_dict['id'],)
        )
        post_dict['replies'] = [dict(reply) for reply in cursor.fetchall()]
        posts_list.append(post_dict)
    
    conn.close()
    return posts_list


def get_blogs_from_db() -> List[Dict[str, Any]]:
    """Fetch all blogs from database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute('SELECT id, title, category, content, timestamp FROM blogs ORDER BY id DESC')
    blogs = cursor.fetchall()
    
    conn.close()
    return [dict(blog) for blog in blogs]


def send_email(fullname: str, sender_email: str, message: str) -> bool:
    """Send email via Gmail SMTP"""
    try:
        gmail_user = os.getenv("GMAIL_USER")
        gmail_password = os.getenv("GMAIL_APP_PASSWORD")
        recipient_email = os.getenv("CONTACT_RECIPIENT_EMAIL", gmail_user or "")

        if not gmail_user or not gmail_password:
            print("Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables")
            return False
        
        msg = MIMEMultipart()
        msg['From'] = gmail_user
        msg['To'] = recipient_email
        msg['Subject'] = f"New Contact from {fullname}"
        
        body = f"""You have a new message from your portfolio:
        
Name: {fullname}
Email: {sender_email}

Message:
{message}"""
        
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(gmail_user, gmail_password)
        server.send_message(msg)
        server.quit()
        
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


init_db()

@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/daily-routine")
async def daily_routine_page(request: Request):
    posts = get_posts_from_db()
    return templates.TemplateResponse("daily-routine.html", {"request": request, "posts": posts})

@app.post("/api/routine/post")
async def create_post(post: Post) -> Dict[str, Any]:
    """Create a new daily routine post"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    timestamp = datetime.now().isoformat()
    cursor.execute('INSERT INTO posts (message, timestamp) VALUES (?, ?)', (post.message, timestamp))
    conn.commit()
    
    post_id = cursor.lastrowid
    conn.close()
    
    return {
        "id": post_id,
        "message": post.message,
        "timestamp": timestamp,
        "replies": []
    }


@app.post("/api/routine/reply/{post_id}")
async def add_reply(post_id: int, reply: Reply) -> Dict[str, Any]:
    """Add a reply to a post"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    timestamp = datetime.now().isoformat()
    cursor.execute(
        'INSERT INTO replies (post_id, message, timestamp) VALUES (?, ?, ?)',
        (post_id, reply.message, timestamp)
    )
    conn.commit()
    
    reply_id = cursor.lastrowid
    conn.close()
    
    return {
        "id": reply_id,
        "message": reply.message,
        "timestamp": timestamp
    }


@app.get("/api/routine/posts")
async def get_posts() -> List[Dict[str, Any]]:
    """Fetch all posts with replies"""
    return get_posts_from_db()


@app.post("/api/contact")
async def contact(contact: ContactMessage) -> Dict[str, str]:
    """Handle contact form submission and send email"""
    print(f"📨 Contact form received: {contact.fullname} from {contact.email}")
    success = send_email(contact.fullname, contact.email, contact.message)
    
    if success:
        print(f"✅ Email sent to arjunrampal9867@gmail.com")
        return {"status": "success", "message": "Email sent successfully!"}
    else:
        print(f"❌ Failed to send email")
        return {"status": "error", "message": "Failed to send email. Please try again."}


@app.post("/api/blogs")
async def create_blog(blog: BlogPost) -> Dict[str, Any]:
    """Create a new blog post"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    timestamp = datetime.now().isoformat()
    cursor.execute(
        'INSERT INTO blogs (title, category, content, timestamp) VALUES (?, ?, ?, ?)',
        (blog.title, blog.category, blog.content, timestamp)
    )
    conn.commit()
    
    blog_id = cursor.lastrowid
    conn.close()
    
    return {
        "id": blog_id,
        "title": blog.title,
        "category": blog.category,
        "content": blog.content,
        "timestamp": timestamp
    }


@app.get("/api/blogs")
async def get_blogs() -> List[Dict[str, Any]]:
    """Fetch all blogs"""
    return get_blogs_from_db()


@app.put("/api/blogs/{blog_id}")
async def update_blog(blog_id: int, blog: BlogPost) -> Dict[str, Any]:
    """Update a blog post"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    timestamp = datetime.now().isoformat()
    cursor.execute(
        'UPDATE blogs SET title = ?, category = ?, content = ?, timestamp = ? WHERE id = ?',
        (blog.title, blog.category, blog.content, timestamp, blog_id)
    )
    conn.commit()
    conn.close()
    
    return {
        "id": blog_id,
        "title": blog.title,
        "category": blog.category,
        "content": blog.content,
        "timestamp": timestamp
    }


@app.delete("/api/blogs/{blog_id}")
async def delete_blog(blog_id: int) -> Dict[str, str]:
    """Delete a blog post"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM blogs WHERE id = ?', (blog_id,))
    conn.commit()
    conn.close()
    
    return {"status": "success", "message": "Blog deleted successfully!"}