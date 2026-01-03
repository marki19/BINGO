# 🏠 Local Setup Guide - Test Before Deploying

## Quick Start (5 Minutes)

### Prerequisites
- Node.js 18+ installed ([Download](https://nodejs.org/))
- PostgreSQL installed ([Download](https://www.postgresql.org/download/))
- A terminal/command prompt

---

## Step 1: Install Dependencies

Open terminal in the BINGO folder:

```bash
cd /workspace/cmjxmxwzg0001imr3b02fa5d8/BINGO
npm install
```

This will install all the packages (Socket.IO, React, etc.)

---

## Step 2: Set Up Database

### Option A: Using Existing PostgreSQL

1. **Create a database:**
```bash
# Open PostgreSQL command line
psql -U postgres

# Create database
CREATE DATABASE bingo_game;

# Exit
\q
```

2. **Create .env file:**
```bash
cp .env.example .env
```

3. **Edit .env file** with your database info:
```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/bingo_game
CLIENT_URL=http://localhost:5000
PORT=5000
NODE_ENV=development
```

### Option B: Using Docker (Easier)

If you have Docker installed:

```bash
# Start PostgreSQL in Docker
docker run --name bingo-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=bingo_game \
  -p 5432:5432 \
  -d postgres:15

# Your .env should be:
DATABASE_URL=postgresql://postgres:password@localhost:5432/bingo_game
CLIENT_URL=http://localhost:5000
PORT=5000
NODE_ENV=development
```

---

## Step 3: Run Database Migration

This creates all the tables:

```bash
npm run db:push
```

You should see output like:
```
✓ Pushing schema to database...
✓ Done!
```

---

## Step 4: Start the Application

You need **TWO terminals** (keep both running):

### Terminal 1 - Start Backend:
```bash
npm run dev
```

You should see:
```
[express] serving on port 5000
[socket.io] Socket.IO handlers initialized
```

### Terminal 2 - Start Frontend:
```bash
npm run dev:client
```

You should see:
```
VITE ready in 500ms
Local: http://localhost:5000
```

---

## Step 5: Open Browser

Go to: **http://localhost:5000**

You should see the Bingo home page!

---

## 🎮 Testing the Game

### Test as Host:

1. Click **"Host Game"**
2. Enter your name (e.g., "Alice")
3. Select player limit (e.g., 10)
4. Click **Create Game**
5. You'll see:
   - Game link
   - QR code
   - Pattern selector
   - Start Game button

### Test as Player (Same Computer):

1. Copy the game link from host view
2. Open a **new incognito/private window**
3. Paste the game link
4. Enter your name (e.g., "Bob")
5. Click **Join Game**

### Test Real-Time Features:

1. **In Host window:**
   - Select a pattern (e.g., "Any Line")
   - Click **"Start Game"**

2. **In Player window:**
   - You should see "Game Started!" notification
   - Cards become active

3. **In Host window:**
   - Click **"Call Number"** a few times
   - OR enable **"Auto-Call"** toggle

4. **In Player window:**
   - Numbers should appear instantly (no delay!)
   - Click numbers on your card to mark them

5. **Test BINGO:**
   - Keep calling numbers until a card has a winning pattern
   - BINGO button will turn enabled
   - Click it to claim victory!
   - 🎉 Confetti celebration should appear!

---

## 🔍 Verify Everything Works

### ✅ Checklist:

- [ ] Home page loads
- [ ] Can create game as host
- [ ] Can see QR code and game link
- [ ] Can join game in incognito window
- [ ] Player count updates in real-time
- [ ] Can select pattern (host)
- [ ] Can start game (host)
- [ ] Numbers appear instantly when called
- [ ] Can mark numbers on cards
- [ ] BINGO button enables when pattern matches
- [ ] Winner celebration appears
- [ ] Connection status shows green dot
- [ ] Can restart game

---

## 🐛 Troubleshooting

### Problem: "npm run dev" fails

**Solution:**
```bash
# Make sure you're in the right directory
cd /workspace/cmjxmxwzg0001imr3b02fa5d8/BINGO

# Try removing node_modules and reinstalling
rm -rf node_modules package-lock.json
npm install
```

### Problem: Database connection error

**Check your DATABASE_URL in .env:**
```bash
cat .env
```

**Test connection:**
```bash
# Try connecting manually
psql postgresql://postgres:password@localhost:5432/bingo_game
```

**Common fixes:**
- Wrong password in .env
- PostgreSQL not running: `sudo service postgresql start`
- Database doesn't exist: Create it with `CREATE DATABASE bingo_game;`

### Problem: Port 5000 already in use

**Option 1 - Change port:**
Edit `.env`:
```env
PORT=3000
CLIENT_URL=http://localhost:3000
```

Edit `package.json` dev:client script:
```json
"dev:client": "vite dev --port 3000"
```

**Option 2 - Kill the process:**
```bash
# Find what's using port 5000
lsof -ti:5000

# Kill it
kill -9 $(lsof -ti:5000)
```

### Problem: "Socket.IO not connecting"

**Check browser console** (F12 → Console tab)

You should see:
```
Socket.IO connected: abc123xyz
```

If you see errors:
1. Make sure backend is running (Terminal 1)
2. Check `VITE_API_URL` in console: `console.log(import.meta.env.VITE_API_URL)`
3. Should be `http://localhost:5000` or your PORT

### Problem: Cards not generating

**Check server logs** in Terminal 1

If you see database errors:
```bash
# Re-run migration
npm run db:push
```

### Problem: Auto-call not working

1. Make sure game status is "playing" (click Start Game)
2. Check server logs for errors
3. Try manual call first to verify numbers work

### Problem: Pattern selector not showing

**Check browser console for errors**

Common fix:
```bash
# Restart frontend
# In Terminal 2, press Ctrl+C, then:
npm run dev:client
```

---

## 🎯 Quick Test Script

Run through this in 2 minutes:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run dev:client

# Browser: http://localhost:5000
# 1. Create game as host
# 2. Copy game link
# 3. Open incognito window
# 4. Join as player
# 5. Start game (host)
# 6. Enable auto-call
# 7. Watch numbers appear
# 8. Mark some numbers
# 9. Success! ✅
```

---

## 📱 Testing on Mobile Device (Same Network)

### Find Your Local IP:

**On Mac/Linux:**
```bash
ipconfig getifaddr en0
# or
ifconfig | grep "inet "
```

**On Windows:**
```bash
ipconfig
# Look for "IPv4 Address"
```

You'll get something like: `192.168.1.100`

### Update .env:
```env
CLIENT_URL=http://192.168.1.100:5000
```

### Restart backend:
```bash
# Terminal 1 - Ctrl+C then:
npm run dev
```

### On your phone:
- Connect to same WiFi
- Open browser
- Go to: `http://192.168.1.100:5000`
- Scan the QR code or use the link!

---

## 🎨 Developer Mode Test

1. In the game (either as host or player)
2. Type: **dev123** (anywhere on the page, not in an input)
3. UI should turn purple
4. Dev panel should appear
5. Try staging a number
6. Call number - your staged number should be called!

---

## 🔄 Restart Everything

If something gets stuck:

```bash
# Terminal 1 - Ctrl+C
# Terminal 2 - Ctrl+C

# Clear and restart
npm run dev        # Terminal 1
npm run dev:client # Terminal 2

# Refresh browser
```

---

## ✅ You're Ready!

If everything works locally:
- ✅ Numbers appear in real-time
- ✅ Multiple players can join
- ✅ Auto-call works
- ✅ Patterns validate correctly
- ✅ Winner celebration appears

**You're ready to deploy online!** 🚀

Follow `DEPLOYMENT_GUIDE.md` when you're ready to make it public.

---

## 💡 Tips

### Keep Terminals Visible
- Split your terminal or use tabs
- Keep both running while testing

### Use Browser DevTools
- Press F12 to open
- Console tab shows Socket.IO connection
- Network tab shows API calls

### Test with Friends Locally
- Share your local IP (see "Testing on Mobile")
- Friends on same WiFi can join!

### Quick Restart Command
```bash
# Create alias in ~/.bashrc or ~/.zshrc
alias bingo-start="cd /workspace/cmjxmxwzg0001imr3b02fa5d8/BINGO && npm run dev"
```

---

## 📞 Need Help?

Check the logs:
- **Terminal 1** (backend) - Shows API calls and Socket.IO events
- **Terminal 2** (frontend) - Shows Vite build output
- **Browser Console** (F12) - Shows client-side errors

Common log messages you should see:
```
[express] POST /api/games/create 200 in 45ms
[socket.io] Socket connected: abc123
[socket.io] Player Alice joined game XYZ789
[auto-call] Starting auto-call for game XYZ789 with 10s interval
[auto-call] Auto-called number 42 for game XYZ789
```

---

**Happy Testing! 🎉**
