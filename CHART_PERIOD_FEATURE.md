# Training Hours Chart - Period Modification Feature

## Overview
The Training Hours Over Time chart now supports interactive period modification through both button controls and finger/touch gestures.

## Features Added

### 1. Period Selector Buttons
- **Daily**: Shows training hours for each day over the last 30 days
- **Weekly**: Shows training hours for each week over the last 12 weeks (default)
- **Monthly**: Shows training hours for each month over the last 12 months  
- **Yearly**: Shows training hours for each year over the last 5 years

### 2. Touch/Swipe Gestures
- **Swipe Right** (or drag right): Decrease the time range (show fewer periods)
- **Swipe Left** (or drag left): Increase the time range (show more periods)
- **Minimum Range**: 4 periods
- **Maximum Range**: 24 periods

### 3. Visual Feedback
- Active period button is highlighted in red
- Chart title updates to show current period view
- Notification appears when period changes, showing current settings
- Smooth animations for all transitions

## Implementation Details

### Files Modified
1. **`js/chartManager.js`**
   - Added period management properties
   - Updated `createTrainingHoursChart()` to support periods and touch gestures
   - Completely rewrote `getTrainingHoursData()` to handle different periods
   - Added helper methods for period calculations
   - Added touch gesture support methods
   - Updated chart update logic

2. **`js/uiManager.js`**
   - Modified chart HTML structure to include period controls
   - Added event handler for period selection buttons

3. **`styles/components.css`**
   - Added comprehensive styling for chart controls
   - Added period selector button styles with hover effects
   - Added notification popup styles
   - Added responsive design for mobile devices

### Key Methods Added

#### ChartManager Class
- `getPeriodKey(date, period)`: Groups data by the specified period
- `adjustDateByPeriod(date, amount, period)`: Adjusts dates for period calculations
- `formatPeriodLabel(date, period)`: Formats labels for different periods
- `getPeriodLabel()`: Gets dataset label for current period
- `addTouchGesturesSupport(canvas)`: Adds touch/mouse event listeners
- `handleSwipeGesture()`: Processes swipe gestures
- `changePeriodRange(direction)`: Adjusts the number of periods shown
- `changePeriodType(newPeriod)`: Changes the period type (daily/weekly/etc.)
- `showPeriodChangeNotification()`: Shows visual feedback for changes

#### UIManager Class
- `handlePeriodSelection(button)`: Handles period button clicks

## Usage

### Basic Usage
1. Open the application and navigate to the statistics/dashboard view
2. Find the "Training Hours Over Time" chart
3. Use the period buttons (Daily, Weekly, Monthly, Yearly) to change the view
4. Swipe left/right on the chart to adjust the time range

### Testing
A test page `test-chart.html` is included that demonstrates the functionality:
1. Open `test-chart.html` in a browser
2. Click "Add Sample Data" to generate test training sessions
3. Test the period buttons and swipe gestures

## Technical Notes

### Touch Gesture Detection
- Uses both `touchstart`/`touchend` for mobile and `mousedown`/`mouseup` for desktop
- Minimum swipe distance of 50 pixels to trigger range change
- Prevents accidental triggers during normal chart interactions

### Period Calculations
- **Daily**: Groups by ISO date string (YYYY-MM-DD)
- **Weekly**: Groups by year and week number
- **Monthly**: Groups by year and month
- **Yearly**: Groups by year

### Responsive Design
- Period selector buttons stack vertically on mobile devices
- Button text size adjusts for smaller screens
- Chart maintains touch functionality across all device sizes

### Performance Considerations
- Chart data is recalculated only when period changes
- Smooth animations without blocking the UI
- Efficient date calculations using native JavaScript Date methods

## Browser Compatibility
- Modern browsers with ES6+ support
- Touch events supported on all mobile browsers
- Fallback mouse events for desktop interaction
- Chart.js 3.x+ required for chart functionality

## Future Enhancements
- Custom date range selection
- Period comparison mode
- Export functionality for different periods
- Keyboard shortcuts for period navigation