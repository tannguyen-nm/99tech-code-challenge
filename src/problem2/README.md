# Problem 2: Fancy Swap Form

An interactive currency swap form with real-time exchange rates, built with Vite and vanilla JavaScript.

## 📁 Structure

```
problem2/
├── README.md            # This file
├── challenge/
│   └── CHALLENGE.md     # Original problem statement
├── src/
│   ├── index.html       # Main HTML
│   ├── style.css        # Styles
│   └── script.js        # Application logic
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (version 14 or higher recommended)
- **npm** (comes with Node.js)

### Installation

```bash
# Navigate to problem2 directory
cd src/problem2

# Install dependencies
npm install
```

### Running the Application

**Development Mode** (with hot reload):
```bash
npm run dev
```
The app will open at `http://localhost:5173` (or another port if 5173 is busy).

**Build for Production**:
```bash
npm run build
```
Built files will be in the `dist/` folder.

**Preview Production Build**:
```bash
npm run preview
```

## ✨ Features

### Token Swap
1. **Select From Token**: Click the token selector on the "You Send" field
2. **Select To Token**: Click the token selector on the "You Receive" field
3. **Enter Amount**: Type the amount you want to swap
4. **View Exchange Rate**: See real-time exchange rate between tokens
5. **Swap Direction**: Click the ⇅ button to swap token positions
6. **Confirm Swap**: Click "Confirm Swap" to execute (mocked with 2s delay)

### Token Selection
- Search tokens by symbol
- View token prices in USD
- Token icons loaded from GitHub repository

### Validation
- Amount must be greater than 0
- Clear error messages for invalid inputs
- Submit button disabled until valid

### User Experience
- 🎨 **Modern UI** - Gradient design with smooth animations
- 🔍 **Searchable Tokens** - Quick token selection
- 💱 **Live Exchange Rates** - Real-time calculation
- ⇅ **Quick Swap** - Reverse token positions with one click
- ✅ **Smart Validation** - Clear error feedback
- ⏳ **Loading States** - Visual feedback on submit
- 📱 **Responsive** - Works on mobile and desktop

## 🛠️ Tech Stack

- **Vite** - Build tool and dev server (bonus points!)
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styles with animations
- **Fetch API** - Token price data retrieval

## 🌐 Data Sources

- **Token Prices**: https://interview.switcheo.com/prices.json
- **Token Icons**: https://github.com/Switcheo/token-icons

## 🔧 Troubleshooting

### Port Already in Use

If port 5173 is busy, Vite will automatically use the next available port. Check the terminal output for the actual URL.

### Token Icons Not Loading

Some tokens may not have icons in the repository. The app gracefully handles missing icons by hiding them.

### API Not Loading

If token prices don't load:
1. Check your internet connection
2. Ensure the API endpoint is accessible: https://interview.switcheo.com/prices.json
3. Check browser console for errors

## 📝 Implementation Notes

- The swap transaction is **mocked** with a 2-second delay
- Prices are fetched on app load and don't auto-refresh
- Latest price for each token is used (filtered by date)
- Only tokens with valid prices (> 0) are shown
- Built with Vite for modern development experience (bonus points!)

## 🎯 Implementation Highlights

### Simple & Clean
- No complex frameworks or libraries
- Single HTML, CSS, and JS files
- Easy for anyone to understand and modify

### Production Ready
- Proper error handling
- Loading states
- Input validation
- Responsive design
- Optimized build with Vite

---