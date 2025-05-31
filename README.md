# Productivity Tracker

Track your productivity and get AI-powered weekly summaries. Search summaries of past weeks to see how you've changed.

Also includes an Easter Egg if you like TRON ;)

## Installation

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn package manager

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd productivity-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## 🎯 Usage Guide

### Data Persistence
- All data is stored in browser localStorage
- Tasks and summaries persist between sessions
- Export/import functionality for data backup

## 🏗️ Technical Architecture

### Component Structure
```
src/
├── App.js
├── components/
│   ├── ProductivityTracker.js  # Main container component
│   ├── TaskManager.js          # Task CRUD operations
│   ├── Visualizations.js       # Charts and analytics
│   ├── WeeklySummary.js        # AI summary generation
│   ├── SearchAgent.js          # Semantic search
│   └── AdminDashboard.js       # Configuration & monitoring
```

## 🎨 Design Decisions

### Visual Hierarchy
- Clear navigation with active state indicators
- Proper contrast ratios for accessibility
- Progressive disclosure of information

### Interaction Design
- Hover effects and loading states for async operations
- Form validation with inline feedback

### Animation Strategy
- Subtle entrance animations for new content
- Staggered animations for lists
- Physics-based transitions using Framer Motion

### Responsive Design
- Mobile-first using flexible grid layouts
- Touch-friendly button sizes
- Readable typography at all screen sizes


## 📱 Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+


## 📄 License

MIT License - see LICENSE file for details
