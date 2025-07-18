# 🥋 Kung Fu Tracker

A modern, interactive web application for tracking Kung Fu training sessions, progress, and belt advancement. Built with vanilla JavaScript, featuring a beautiful UI, comprehensive statistics, and a realistic belt progression system.

## ✨ Features

### 📊 Session Management
- **Add Training Sessions**: Log date, duration, training type, and detailed notes
- **Edit & Delete**: Full CRUD operations for all training sessions
- **Search & Filter**: Find sessions by type, date range, or search terms
- **Multiple Training Types**: Shaolin / Yiquan / Taijiquan, tuishou / sanda

### 📈 Statistics & Analytics
- **Interactive Charts**: Powered by Chart.js for beautiful data visualization
- **Training Hours**: Weekly and monthly training hour tracking
- **Type Distribution**: See how much time you spend on each training type
- **Progress Over Time**: Monthly progress tracking with sessions and hours
- **Consistency Tracking**: Visual representation of training consistency

### 🏆 Belt Progression System
- **Realistic Belt System**: White → Yellow → Orange → Green → Blue → Brown → Black
- **Achievement Requirements**: Based on total hours, weekly consistency, and training variety
- **Progress Tracking**: Visual progress bars and requirement checklists
- **Motivational Messages**: Encouraging feedback based on your progress
- **Belt Unlock Animations**: Spectacular animations when advancing to the next belt

### 📅 Calendar View
- **Monthly Calendar**: Visual overview of training sessions
- **Session Indicators**: See training days at a glance
- **Navigation**: Easy month-to-month navigation
- **Session Details**: Click on dates to see session information

### 🎨 Modern UI/UX
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Dark/Light Themes**: Toggle between themes with smooth transitions
- **Smooth Animations**: Modern CSS animations throughout the app
- **Accessibility**: Built with accessibility best practices
- **Progressive Enhancement**: Works even if JavaScript is disabled (basic functionality)

### 💾 Data Management
- **Local Storage**: All data stored locally in your browser
- **Export/Import**: Backup and restore your training data
- **No Server Required**: Runs entirely in the browser
- **Data Persistence**: Your data survives browser restarts

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome 60+, Firefox 55+, Safari 12+, Edge 79+)
- No server setup required!

### Installation

1. **Clone or Download** the repository:
   ```bash
   git clone https://github.com/yourusername/kungfu-tracker.git
   cd kungfu-tracker
   ```

2. **Open in Browser**:
   - Simply open `index.html` in your web browser
   - Or use a local server (recommended for development):
   ```bash
   # Using Python
   python -m http.server 8080
   
   # Using Node.js
   npx http-server
   
   # Using Live Server (VS Code extension)
   # Right-click index.html → "Open with Live Server"
   ```

3. **Start Training**:
   - The app will start with no data: everything is empty by default
   - Click "Add Session" to log your first training session
   - Explore the different views: Dashboard, Sessions, Calendar, Statistics, Belts

## 📁 Project Structure

```
kungfu-tracker/
├── index.html                 # Main HTML file (lightweight, dynamic)
├── styles/                    # Modular CSS files
│   ├── base.css              # Reset and base styles
│   ├── layout.css            # Global layout structure
│   ├── components.css        # Component-specific styles
│   ├── animations.css        # Modern CSS animations
│   └── themes.css            # Color themes and variables
├── js/                       # Modular JavaScript files
│   ├── main.js               # Application entry point
│   ├── router.js             # Client-side routing
│   ├── storage.js            # Data storage and backend simulation
│   ├── sessionManager.js     # Session CRUD operations
│   ├── chartManager.js       # Chart and statistics management
│   ├── rewardSystem.js       # Belt progression and achievements
│   └── uiManager.js          # Dynamic UI rendering
├── data/                     # Sample data
│   └── seed.json             # Initial demo data
└── README.md                 # This file
```

## 💻 Technical Details

### Architecture
- **Modular Design**: Each feature is separated into its own module
- **Event-Driven**: Uses custom events for inter-module communication
- **Component-Based**: UI components are dynamically rendered
- **Responsive**: Mobile-first design with CSS Grid and Flexbox

### Technologies Used
- **Vanilla JavaScript**: No frameworks, maximum performance
- **Chart.js**: Interactive charts and data visualization
- **CSS Grid & Flexbox**: Modern layout techniques
- **Local Storage API**: Browser-based data persistence
- **Web Standards**: Uses modern web APIs and best practices

### Browser Compatibility
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ⚠️ Internet Explorer: Not supported

## 🎯 Usage Guide

### Adding Training Sessions
1. Click "Add Session" in the navigation
2. Fill in the session details:
   - **Date**: When you trained (defaults to today)
   - **Duration**: How long you trained (in minutes)
   - **Type**: Select from 8 different training types
   - **Notes**: Optional detailed description
3. Click "Add Session" to save

### Viewing Statistics
1. Navigate to "Statistics" to see comprehensive analytics
2. View interactive charts showing:
   - Training hours over time
   - Distribution of training types
   - Monthly progress
   - Training consistency

### Belt Progression
1. Go to "Belts" to see your current belt and progress
2. Requirements for the next belt are clearly displayed
3. Progress bars show how close you are to each requirement
4. Belt unlocks trigger special animations and notifications

### Calendar View
1. Click "Calendar" to see a monthly overview
2. Days with training sessions are highlighted
3. Use navigation arrows to browse different months
4. Click on dates to see session details

## ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + H` - Go to Dashboard
- `Ctrl/Cmd + N` - Add New Session
- `Ctrl/Cmd + S` - View Sessions
- `Ctrl/Cmd + C` - View Calendar
- `Ctrl/Cmd + T` - View Statistics
- `Ctrl/Cmd + B` - View Belts
- `?` - Show keyboard shortcuts help

## 🎨 Customization

### Adding New Training Types
Edit the `trainingTypes` array in `js/sessionManager.js`:
```javascript
this.trainingTypes = [
    'Shaolin / Yiquan / Taijiquan',
    'tuishou / sanda',
    'Your New Type' // Add your custom type here
];
```

### Modifying Belt Requirements
Edit the requirements in `js/storage.js` in the `getBeltRequirements()` method:
```javascript
yellow: [
    { type: 'totalHours', value: 5, label: 'Complete 5 hours of training' },
    { type: 'totalSessions', value: 3, label: 'Complete 3 training sessions' }
    // Add or modify requirements
],
```

### Theming
The app uses CSS custom properties for theming. Edit `styles/themes.css` to customize colors:
```css
:root {
    --primary-red: #c41e3a;      /* Main accent color */
    --primary-gold: #ffd700;     /* Achievement color */
    --accent-primary: #d32f2f;   /* Primary accent */
    /* Modify these values to change the theme */
}
```

## 📊 Data Export/Import

### Exporting Data
1. Your training data is automatically saved in browser localStorage
2. Use browser dev tools to access: `localStorage.getItem('kungfu_sessions')`
3. Future versions will include built-in export functionality

### Importing Data
1. Data can be imported by setting localStorage values
2. Use your own exported data as a format reference

## 🔧 Development

### Local Development Setup
1. Clone the repository
2. Use a local server (see Installation section)
3. Make changes to the code
4. Refresh browser to see changes

### Adding Features
1. Create new modules in the `js/` directory
2. Add corresponding styles in `styles/components.css`
3. Update the UI manager to handle new components
4. Follow the existing modular architecture

### Testing
- Open browser developer tools
- Check console for any errors
- Test all features across different screen sizes
- Verify data persistence by refreshing the page

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Chart.js** - For beautiful, responsive charts
- **Font Awesome** - For comprehensive icon library
- **Kung Fu Community** - For inspiration and feedback on realistic progression systems

## 🐛 Troubleshooting

### Common Issues

**Q: The app isn't loading properly**
A: Check browser compatibility and ensure JavaScript is enabled

**Q: My data disappeared**
A: Check if you're using the same browser and haven't cleared localStorage

**Q: Charts aren't showing**
A: Ensure Chart.js is loading properly and check browser console for errors

**Q: Animations are not smooth**
A: Try disabling browser extensions or check if you have reduced motion settings enabled

### Getting Help

- Check the browser console for error messages
- Ensure you're using a supported browser
- Try clearing browser cache and localStorage
- Create an issue in the GitHub repository

---

**Happy Training! 🥋**

*"The best time to plant a tree was 20 years ago. The second best time is now."*

Start your Kung Fu journey today with Kung Fu Tracker! 