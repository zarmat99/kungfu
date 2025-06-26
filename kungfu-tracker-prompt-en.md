
# Prompt for Cursor AI – Kung Fu Tracking App

---

## 🔧 Notes for the AI (Claude 4 Sonnet)

**⚠️ NEVER lose sight of these key points:**

1. **Absolute focus on user experience**:
   - The interface must be modern, smooth, and visually appealing.
   - Every feature must motivate users to continue training over time.

2. **Strict modularity**:
   - Each file, function, style, and component must be separate and reusable.
   - Avoid overloading a single module or script with too many responsibilities.

3. **All features are mandatory**:
   - Do not skip or simplify any of the described features (stats, belts, CRUD, animations, etc.).
   - Do not treat anything as “optional” or “extra”.

4. **Backend simulation**:
   - No external servers. Only use JSON and `localStorage` to manage data.
   - Behavior must simulate a real backend via a logical structure and `storage.js`.

5. **Spectacular but lightweight animations**:
   - Every key UI element must include smooth transitions or animations.
   - Maintain lightweight code and cross-browser compatibility.

6. **Clean front-end architecture**:
   - Minimal index HTML: should only load components dynamically.
   - CSS must be separated by purpose: `base`, `layout`, `components`, `animations`, `themes`.

7. **End goal:**
   - Create a usable app for a real Kung Fu enthusiast.
   - It should be satisfying to use daily, help track improvement, and reward dedication.

---

## ✅ Required Features (Mandatory)

### 1. Session logging and management
- Each session must include:
  - `date`
  - `duration`
  - `training type`
  - `notes`
- Must support **add, edit, and delete**

### 2. Session visualization
- **Chronological view** (list ordered by date)
- **Monthly calendar view**
- Ability to **filter by training type** and **search by text**

### 3. Stats and charts
- Use **Chart.js** to visualize:
  - Weekly and monthly training hours
  - Time distribution by type (forms, tui shou, sparring, etc.)
  - Progress over time

### 4. Reward system with belts
- Integrate a real **Kung Fu belt system**:
  - `white → yellow → orange → green → blue → brown → black`
- Belts unlock based on **realistic goals** (e.g., total hours, weekly consistency, training variety)
- Show **progress toward next belt** with engaging visuals

### 5. Backend simulation
- Simulate a backend using **static or in-memory JSON**
- Full CRUD management using `localStorage`
- No need for a server: everything must work locally

### 6. Modern UI and advanced animations
- **Modern**, **responsive**, **accessible** UI
- Layout with **Flexbox and CSS Grid**
- **Visually stunning animations**:
  - Smooth transitions, animated buttons, belt effects, animated charts
  - Use `@keyframes`, `transition`, `transform`, `opacity`, and modern animation techniques
  - Every component should feature **elegant visual feedback**

---

## ✅ Project Architecture (Modular and Clear)

### 📁 Folder Structure

```
kungfu-tracker/
├── index.html                # Main HTML (lightweight, dynamic)
├── components/
│   ├── header.html
│   ├── session-form.html
│   ├── session-list.html
│   ├── calendar.html
│   ├── stats.html
│   ├── rewards.html
├── styles/
│   ├── base.css             # Reset + base rules
│   ├── layout.css           # Global layout structure
│   ├── components.css       # Component-specific styles
│   ├── animations.css       # All modern animations
│   ├── themes.css           # Colors, dark/light mode
├── js/
│   ├── main.js              # Entry point
│   ├── router.js            # Dynamic component loader
│   ├── sessionManager.js    # Session CRUD
│   ├── chartManager.js      # Stats and charts
│   ├── rewardSystem.js      # Belts and goals
│   ├── storage.js           # Backend simulation/localStorage
│   ├── uiManager.js         # Dynamic UI rendering
├── data/
│   └── seed.json            # Simulated initial data (optional)
└── assets/
    ├── images/              # Icons, belts, backgrounds
    └── fonts/               # Custom fonts
```

---

## ✅ Final Goal

The app must offer a **modern, smooth, engaging, and motivational user experience**.  
Every part must be **modular, reusable, and well-documented**. None of the described features is optional: everything listed above **must be implemented**.
