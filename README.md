# FOLIO — Digital Bullet Journal

Personal finance · nutrition · wellness · workouts · daily journaling

**No backend. No account. No server.** Everything runs in your browser and deploys free to GitHub Pages.

---

## What's inside

| Module | Features |
|---|---|
| Dashboard | Live overview — balance, calories, goals, streak |
| Finance | Income / expense / savings tracking with category chart |
| Nutrition | Manual food log + AI photo analyzer (optional) |
| Wellness | Custom daily habit goals with progress rings |
| Workout | Session logging with sets, reps, weight, volume tracking |
| Journal | Mood check-in, gratitude, intentions, free write, tags, streak |
| Settings | Profile prefs, export backup, import backup |

---

## Deploy to GitHub Pages (5 steps, ~5 minutes)

### Step 1 — Create a GitHub repository

1. Go to **github.com** and sign in
2. Click the **+** icon top-right → **New repository**
3. Name it anything, e.g. `folio-app`
4. Set it to **Public** (required for free GitHub Pages)
5. Leave everything else blank — do NOT add a README or .gitignore
6. Click **Create repository**

---

### Step 2 — Push this code

Open a terminal, navigate to this folder, and run:

```bash
npm install
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/folio-app.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `folio-app` with your actual GitHub username and repo name.

---

### Step 3 — Enable GitHub Pages

1. Go to your repo on github.com
2. Click **Settings** (top tab bar)
3. Click **Pages** in the left sidebar
4. Under **Source**, select **GitHub Actions**
5. That's it — no other changes needed

---

### Step 4 — Trigger your first deploy

The deploy runs automatically whenever you push to `main`. Since you just pushed in Step 2, it's probably already running.

To check:
1. Click the **Actions** tab in your repo
2. You'll see a workflow called **Deploy to GitHub Pages** running
3. Wait ~2 minutes for the green checkmark ✓

---

### Step 5 — Open your live app

Your app is now live at:

```
https://YOUR_USERNAME.github.io/folio-app/
```

Bookmark it. That's your personal Folio URL — open it on any device.

---

## Optional: Enable AI food photo analysis

The nutrition page can analyze food photos using the Anthropic API.

1. Get a free API key at **console.anthropic.com** → API Keys
2. In your GitHub repo, go to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Name: `VITE_ANTHROPIC_API_KEY`
5. Value: your API key (starts with `sk-ant-...`)
6. Click **Add secret**
7. Go to **Actions** tab → click the latest workflow → **Re-run all jobs**

The AI analyzer will now work on your live site.

---

## Making changes

Any time you edit files and push, GitHub automatically rebuilds and redeploys:

```bash
# edit files, then:
git add .
git commit -m "describe your change"
git push
# live in ~2 minutes
```

---

## Backing up your data

Your data is stored in your **browser's localStorage** — it does not sync to GitHub.

To back it up:
- Open the app → **Settings** → **Export backup (.json)**
- Save the file somewhere safe (Google Drive, Dropbox, etc.)

To restore on a new browser or device:
- Open the app → **Settings** → **Import backup (.json)**
- Select your saved file

---

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## Tech stack

- React 18 + Vite
- React Router (HashRouter for GitHub Pages compatibility)
- Recharts for finance charts
- localStorage for all data persistence
- GitHub Actions for automatic deployment
- Anthropic Claude API for food photo analysis (optional)

<!-- updated -->
