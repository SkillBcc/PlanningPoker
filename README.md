# 🃏 Planning Poker - Free & No Ads

A beautiful, light, real-time Planning Poker application designed for agile teams to estimate their user stories seamlessly. Fully responsive, highly interactive, and built with modern full-stack web technologies.

---

## 🎯 Project Goals & Vision

Estimating user stories should be simple, collaborative, and distraction-free. This project was built to address the bloat of other planning poker tools by providing:
- **Instant Rooms**: Create and join estimation rooms in seconds with absolute zero friction.
- **Real-Time Collaboration**: Powered by WebSockets to ensure that votes, resets, and card reveals are instant across all screens.
- **Aesthetic Precision**: Framed by a gorgeous, eye-friendly, high-contrast dark theme designed with generous spacing and modern typography.
- **Spectator Mode**: Allow Product Owners, Scrum Masters, or stakeholders to observe the session without throwing off vote counts.
- **100% Free & No Ads**: No paywalls, no login barriers, and absolutely no intrusive advertisements.

---

## ✨ Features

- ⚡ **Instant Rooms**: Generate unique codes (e.g. `43f1xk92`) and shareable links instantly.
- 💬 **Live Synchronization**: Every card vote and stage update is propagated immediately to all clients.
- 🕵️ **Voter vs. Spectator Roles**: Seamlessly switch between Voter and Spectator mode.
- 🎯 **Intelligent Button Locks**: Spectators mode cannot be selected if a user already voted and the cards are currently revealed. Buttons reset dynamically only when the active task is cleared or reset.
- 📃 **Task List Management**: Add story descriptions dynamically to keep the team aligned on what they are voting on.

---

## 🛠️ Technology Stack

- **Frontend**: [React 19](https://react.dev/), [Vite 6](https://vite.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **State & Animations**: [Motion](https://motion.dev/) (formerly Framer Motion), [Lucide React Icons](https://lucide.dev/)
- **Backend**: [Express](https://expressjs.com/) (Node.js server)
- **Real-Time Engine**: [ws](https://github.com/websockets/ws) (Native WebSockets)

---

## 🚀 How to Run Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/SkillBcc/PlanningPoker.git
   cd PlanningPoker
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   This will boot up the full-stack server running Express and Vite side-by-side. Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Production Build**:
   ```bash
   npm run build
   ```
   This builds the React static files and bundles the backend server into a single highly efficient executable at `dist/server.cjs`.

5. **Start Production Mode**:
   ```bash
   npm run start
   ```

---

## 🚀 Deployment & GitHub Actions (Solving Blank Screen)

### Why did you see a blank screen on GitHub Pages?

1. **Asset Base Paths**: By default, Vite builds the app to run on the root `/` path. When you host it on GitHub Pages (which lives under `https://<username>.github.io/<repo-name>/`), the browser looks for files at `https://<username>.github.io/assets/...` instead of the subdirectory, causing **404 Not Found** errors and a blank screen.
   - *Fix applied*: We configured `base: './'` in `vite.config.ts` to make all assets relative.
2. **Missing Build Actions**: The standard GitHub starter workflow only ran `echo Hello, world!` instead of installing Node and running the compilation pipeline.

### Choosing Your Deployment Path:

Since Planning Poker uses a **real-time WebSocket server (`server.ts`)**, you have two main hosting options:

#### Option A: Full-Stack Cloud Host (Recommended)
Deploy the **entire application** (client and server) together on a platform that supports Node.js and persistent WebSockets:
- **Render** (using free web services)
- **Railway**
- **Fly.io**
- **Google Cloud Run**

These platforms will automatically detect the `package.json` scripts:
- **Build command**: `npm run build`
- **Start command**: `npm run start` (launches the compiled Express WebSocket server which also serves the React frontend).

#### Option B: Decoupled Deploy (Static Front + Decoupled Back)
If you wish to host the static frontend on **GitHub Pages**, we have created a workflow file under `.github/workflows/deploy.yml` which builds and deploys the files to the `gh-pages` branch.
- **Important**: To use this, you must change `BrowserRouter` in `src/App.tsx` to `HashRouter` (to avoid 404 on refresh) and configure an external WebSocket URL in `WebSocketService.ts` to connect to a server hosted elsewhere.

---

## 🤝 Contributing

We love contributions! Whether you want to improve the UI, add custom card decks (Fibonacci, T-Shirt Sizes, Hours), or optimize the WebSocket scaling, follow these steps:

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request!

---

*Made with 💻 and 🃏. Free and ad-free, forever.*
