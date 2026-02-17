# Deployment Guide

## Option 1: Render.com (Recommended)

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Name: your-project-name
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Click Deploy

Your app will be live at: `https://your-project-name.onrender.com`

---

## Option 2: Railway.app

1. Go to https://railway.app
2. Click "Create New Project" → "Deploy from GitHub"
3. Select your repository
4. Add `Procfile` to your project (already done ✓)
5. Click Deploy

Your app will be live automatically!

---

## Option 3: Heroku (if available)

```bash
heroku login
heroku create your-app-name
git push heroku main
```

---

## Important Notes:
- Your SQLite database won't persist across deployments
- For production, use PostgreSQL (Render provides free tier)
- Keep `requirements.txt` updated: `pip freeze > requirements.txt`
- Set environment variables on the platform (if needed)

## Test Locally First:
```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Visit: http://localhost:8000
