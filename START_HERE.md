# 🎮 Online Multiplayer Bingo - START HERE

## 👋 Welcome!

This is a **fully-featured online multiplayer bingo game** with real-time updates, multiple win patterns, auto-call, QR code sharing, and more!

---

## 🚀 Quick Start (Choose One)

### Option 1: Automated Setup (Easiest)

```bash
cd /workspace/cmjxmxwzg0001imr3b02fa5d8/BINGO
./START_LOCAL.sh
```

The script will guide you through setup!

### Option 2: Manual Setup (5 Steps)

```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env
# Edit .env and set your DATABASE_URL

# 3. Run database migration
npm run db:push

# 4. Start backend (Terminal 1)
npm run dev

# 5. Start frontend (Terminal 2)
npm run dev:client
```

Then open: **http://localhost:5000**

---

## 📚 Documentation

- **[LOCAL_SETUP.md](./LOCAL_SETUP.md)** ⭐ **START HERE** - Detailed local testing guide
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Complete feature documentation
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Deploy to production
- **[COMPLETED_FEATURES.md](./COMPLETED_FEATURES.md)** - What's been built

---

## ⚡ Super Quick Test

Already have PostgreSQL? Try this:

```bash
# 1. Install & setup
npm install
cp .env.example .env
# Edit .env: Set DATABASE_URL to your PostgreSQL
npm run db:push

# 2. Start (2 terminals)
npm run dev        # Terminal 1
npm run dev:client # Terminal 2

# 3. Open browser
# http://localhost:5000
```

---

## 🎯 What You'll See

### As Host:
1. Create game
2. See QR code and shareable link
3. Select win pattern (11 options!)
4. Start game
5. Call numbers manually or auto-call
6. Winner celebration when someone wins!

### As Player:
1. Join via QR code or link
2. Get up to 10 bingo cards
3. Mark numbers as they're called
4. Click BINGO when you have winning pattern
5. 🎉 Confetti celebration!

---

## ✨ Cool Features

### Real-Time Multiplayer
- WebSocket powered (Socket.IO)
- Instant updates, no polling
- Connection status indicator

### 11 Win Patterns
- Line, Column, Diagonal
- Four Corners, X-Pattern, Plus
- Frame, Blackout, T, L, Diamond
- Visual pattern selector

### Auto-Call
- 5s, 10s, 15s, 30s intervals
- Toggle on/off during game
- Auto-stops when game ends

### Developer Mode
- Type "dev123" to activate
- Stage specific numbers
- View action logs
- Purple-themed UI

### Mobile Friendly
- Responsive design
- QR code for easy joining
- Touch-friendly controls

---

## 🔧 Prerequisites

- **Node.js 18+** ([Download](https://nodejs.org/))
- **PostgreSQL** ([Download](https://www.postgresql.org/download/))
  - OR use Docker: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15`

---

## 🐛 Common Issues

### "Cannot connect to database"
**Fix:** Edit `.env` and set correct `DATABASE_URL`
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/bingo_game
```

### "Port 5000 already in use"
**Fix:** Change port in `.env` and `package.json`:
```env
PORT=3000
```

### "npm run dev fails"
**Fix:** Delete and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### More help?
See **[LOCAL_SETUP.md](./LOCAL_SETUP.md)** - Troubleshooting section

---

## 📱 Test on Phone

1. Find your local IP: `ifconfig | grep inet` (Mac/Linux) or `ipconfig` (Windows)
2. Update .env: `CLIENT_URL=http://192.168.1.100:5000`
3. Restart backend
4. On phone (same WiFi): Go to `http://192.168.1.100:5000`

---

## 🚢 Ready for Production?

Once local testing works, deploy online:
1. Read **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**
2. Deploy backend to Railway
3. Deploy frontend to Vercel
4. Share with the world!

---

## 📊 Tech Stack

- **Frontend:** React 19 + Vite + Socket.IO Client
- **Backend:** Node.js + Express + Socket.IO Server
- **Database:** PostgreSQL + Drizzle ORM
- **UI:** shadcn/ui + Radix + Tailwind CSS
- **Features:** QR Code, Confetti, Auto-call, Patterns

---

## 🎓 How to Play

### Host:
1. Click "Host Game"
2. Share link/QR code with players
3. Select win pattern
4. Start game
5. Call numbers (or enable auto-call)
6. First valid BINGO wins!

### Player:
1. Join via link/QR code
2. Wait for game to start
3. Click numbers on cards to mark them
4. BINGO button enables when you have pattern
5. Click to claim victory!

---

## 🔥 Pro Tips

- **Multiple browsers** - Test host and player on same computer using incognito
- **Auto-call** - Great for faster games (use 10s interval)
- **Developer mode** - Type "dev123" for testing controls
- **Pattern variety** - Try different patterns for different game speeds
- **Blackout** - Ultimate challenge! (all 25 numbers)

---

## 📁 Project Structure

```
BINGO/
├── client/          # React frontend
│   └── src/
│       ├── components/  # UI components
│       ├── lib/         # Game logic, Socket.IO
│       └── pages/       # Home, Game room
├── server/          # Node.js backend
│   ├── routes.ts        # API endpoints
│   ├── socket-handlers.ts  # WebSocket events
│   └── auto-caller.ts   # Auto-call manager
├── shared/          # Shared code
│   ├── schema.ts        # Database tables
│   └── pattern-validator.ts  # Win patterns
└── docs/            # All guides
```

---

## ✅ Quick Test Checklist

- [ ] Home page loads
- [ ] Create game as host
- [ ] Copy game link
- [ ] Join in incognito window
- [ ] Start game
- [ ] Call a few numbers
- [ ] Numbers appear instantly
- [ ] Enable auto-call
- [ ] Mark numbers on card
- [ ] BINGO button works
- [ ] Winner celebration shows

If all work: **You're ready!** ✨

---

## 🆘 Need Help?

1. Check [LOCAL_SETUP.md](./LOCAL_SETUP.md) - Detailed troubleshooting
2. Check browser console (F12) for errors
3. Check terminal logs for backend errors
4. Make sure both servers are running

---

## 🎉 Features Implemented

✅ Real-time multiplayer with WebSocket
✅ 11 different win patterns
✅ Auto-call with configurable intervals
✅ QR code sharing
✅ Winner celebration with confetti
✅ Developer mode for testing
✅ Connection status indicator
✅ Mobile responsive design
✅ Game state management (start/pause/restart)
✅ Pattern selector with visual previews
✅ Up to 500 players per game
✅ Up to 10 cards per player

**100% feature complete!** 🚀

---

## 📞 Quick Commands

```bash
# Fresh start
npm install
npm run db:push

# Run servers
npm run dev        # Backend
npm run dev:client # Frontend

# Restart database
npm run db:push

# Build for production
npm run build

# Check TypeScript
npm run check
```

---

**Ready to play? Let's go! 🎲**

Start with: **[LOCAL_SETUP.md](./LOCAL_SETUP.md)** for detailed instructions.
