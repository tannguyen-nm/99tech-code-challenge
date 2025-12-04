# 99Tech Code Challenge

A comprehensive collection of 6 coding challenges demonstrating full-stack development skills, algorithmic thinking, code review capabilities, and system architecture design.

## 👋 Introduction

> ⚠️ **Note**: Depending on your role, you may not need to attempt all questions. Candidates applying for Full-Stack roles are typically recommended to focus on either Frontend or Backend first.

**However**, I found these challenges so exciting that I completed all 6 problems! This repository showcases my capabilities across:
- ✅ **Algorithms** - Multiple implementation approaches with complexity analysis
- ✅ **Frontend** - Modern web applications with Vite and React code review
- ✅ **Backend** - Full CRUD API with database, testing, and production-ready architecture
- ✅ **System Design** - Scalable architecture with security and real-time features

Each solution includes comprehensive documentation, clean code, and demonstrates best practices in software engineering.

---

## 📋 Table of Contents

- [Repository Structure](#-repository-structure)
- [Quick Start](#-quick-start)
- [Problems Overview](#-problems-overview)
- [Getting Started by Problem](#-getting-started-by-problem)
- [Tech Stack](#-tech-stack)
- [Submission](#-submission)

---

## 📁 Repository Structure

```
99tech-code-challenge/
├── README.md                    # This file - Main overview
└── src/
    ├── problem1/                # Three Ways to Sum to n (JavaScript)
    ├── problem2/                # Fancy Swap Form (Vite + Vanilla JS)
    ├── problem3/                # Messy React - Code Review
    ├── problem4/                # Three Ways to Sum to n (TypeScript)
    ├── problem5/                # A Crude Server - CRUD API
    └── problem6/                # Architecture - Live Scoreboard System
```

Each problem follows a consistent structure:

```
problem*/
├── README.md              # Comprehensive guide for this problem
├── challenge/
│   └── CHALLENGE.md       # Original problem statement
├── docs/                  # Technical documentation
└── src/                   # Source code (if applicable)
```

---

## 🚀 Quick Start

### Prerequisites

Depending on which problems you want to run:

- **Node.js** (v14 or higher) - For Problems 2, 4, 5
- **npm** - Comes with Node.js
- **Terminal/Command line** - For running commands

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd 99tech-code-challenge

# Navigate to specific problem
cd src/problem1  # or problem2, problem3, etc.

# Follow instructions in each problem's README.md
```

---

## 📝 Problems Overview

### Problem 1: Three Ways to Sum to n
**Language**: JavaScript
**Type**: Algorithm Implementation
**Difficulty**: ⭐ Easy

Implement 3 different approaches to calculate the sum from 1 to n.

- **Techniques**: Mathematical formula, Iterative loop, Functional programming
- **Key Concepts**: Time/Space complexity, Algorithm trade-offs
- **Run**: `node src/solution.js`

[📖 Full Documentation](src/problem1/README.md)

---

### Problem 2: Fancy Swap Form
**Language**: HTML/CSS/JavaScript
**Type**: Interactive Web Application
**Difficulty**: ⭐⭐ Medium

Build a currency swap form with real-time exchange rates.

- **Features**: Token selection, Live exchange rates, Swap animation
- **Tech Stack**: Vite, Vanilla JavaScript, CSS3
- **Run**: `npm install && npm run dev`

[📖 Full Documentation](src/problem2/README.md)

---

### Problem 3: Messy React - Code Review
**Language**: TypeScript/React
**Type**: Code Review & Refactoring
**Difficulty**: ⭐⭐⭐ Hard

Identify and fix 16 issues in a React component.

- **Issues Found**: 7 Critical bugs, 5 Performance issues, 4 Quality issues
- **Key Skills**: Code review, React optimization, TypeScript best practices
- **Deliverable**: Comprehensive analysis document

[📖 Full Documentation](src/problem3/README.md)

---

### Problem 4: Three Ways to Sum to n (TypeScript)
**Language**: TypeScript
**Type**: Algorithm Implementation with Type Safety
**Difficulty**: ⭐⭐ Medium

TypeScript version with detailed complexity analysis.

- **Approaches**: Mathematical O(1), Iterative O(n), Recursive O(n)
- **Features**: Full type annotations, Performance benchmarks
- **Run**: `npm install && npm test`

[📖 Full Documentation](src/problem4/README.md)

---

### Problem 5: A Crude Server - CRUD API
**Language**: TypeScript
**Type**: Backend API Development
**Difficulty**: ⭐⭐⭐ Hard

Full-featured RESTful CRUD API with database persistence.

- **Tech Stack**: Express.js, Prisma, SQLite, Zod
- **Features**: Full CRUD, Validation, Pagination, Error handling
- **Run**: `npm install && npm run db:migrate && npm run dev`

[📖 Full Documentation](src/problem5/README.md)

---

### Problem 6: Architecture - Live Scoreboard System
**Language**: N/A (Architecture Design)
**Type**: System Design & Architecture
**Difficulty**: ⭐⭐⭐⭐ Expert

Technical specification for a real-time scoreboard with anti-fraud protection.

- **Deliverable**: Complete system architecture document
- **Features**: Real-time updates, Action token security, Scalability design
- **Includes**: Database schema, API specs, Security measures

[📖 Full Documentation](src/problem6/README.md)

---

## 🎯 Getting Started by Problem

### Problem 1 (JavaScript Algorithm)
```bash
cd src/problem1
node src/solution.js
```

### Problem 2 (Vite Web App)
```bash
cd src/problem2
npm install
npm run dev
# Open http://localhost:5173
```

### Problem 3 (Code Review)
```bash
cd src/problem3
# Read docs/ANALYSIS.md for complete review
# View src/refactored.tsx for fixed implementation
```

### Problem 4 (TypeScript Algorithm)
```bash
cd src/problem4
npm install
npm test
```

### Problem 5 (CRUD API)
```bash
cd src/problem5
npm install
npm run db:migrate
npm run dev
# API at http://localhost:3000
```

### Problem 6 (Architecture)
```bash
cd src/problem6
# Read docs/SPECIFICATION.md for complete design
```

---

## 🛠️ Tech Stack

### Languages
- JavaScript (ES6+)
- TypeScript
- HTML5/CSS3

### Frontend
- Vite
- React (code review)
- Vanilla JavaScript

### Backend
- Express.js
- Node.js
- Prisma ORM

### Database
- SQLite (development)
- PostgreSQL (production-ready)

### Validation & Type Safety
- Zod
- TypeScript strict mode

### Tools & Build
- npm
- Vite
- TypeScript Compiler

---

## 📊 Completion Status

| Problem | Status | Type | Lines of Code |
|---------|--------|------|---------------|
| Problem 1 | ✅ Complete | Algorithm | ~50 |
| Problem 2 | ✅ Complete | Frontend | ~300 |
| Problem 3 | ✅ Complete | Code Review | ~450 analysis |
| Problem 4 | ✅ Complete | Algorithm | ~80 |
| Problem 5 | ✅ Complete | Backend API | ~800 |
| Problem 6 | ✅ Complete | Architecture | ~1,200 docs |

**Total**: 6/6 problems completed with comprehensive documentation

---

## 📚 Documentation

Each problem includes:

- ✅ **README.md** - Comprehensive user guide
- ✅ **CHALLENGE.md** - Original problem statement
- ✅ **Source code** - Production-ready implementations
- ✅ **Technical docs** - Architecture, design, specifications

---

## 🧪 Testing

### Problem 1 & 4
- Manual testing with test cases
- Output verification

### Problem 2
- Manual browser testing
- UI/UX validation

### Problem 5
- 88 unit tests
- 84%+ code coverage
- Integration tests included

### Problem 6
- Architecture review
- Design validation

---

## 🎓 Key Learnings

This challenge demonstrates:

1. **Algorithm Design** - Multiple approaches, complexity analysis
2. **Frontend Development** - Modern web apps with Vite
3. **Code Review** - Identifying bugs and performance issues
4. **Type Safety** - TypeScript best practices
5. **Backend Development** - RESTful APIs, database design
6. **System Architecture** - Scalable, secure system design

---

## 📝 Submission

### Repository Information
- **Format**: Git repository
- **Structure**: Organized by problem (problem1-6)
- **Documentation**: Comprehensive READMEs for each problem

### How to Review

1. Start with this README for overview
2. Navigate to specific problem folder
3. Read problem's README.md for details
4. Review source code and documentation
5. Run the code (where applicable)

### What's Included

- ✅ All 6 problems completed
- ✅ Source code with comments
- ✅ Comprehensive documentation
- ✅ Test cases and examples
- ✅ Architecture diagrams (Problem 6)

---

## 🏆 Highlights

### Problem 1
- Three distinct algorithmic approaches
- O(1) optimal solution with mathematical formula

### Problem 2
- Modern Vite-based build system
- Real-time exchange rate integration
- Smooth animations and UX

### Problem 3
- 16 issues identified and documented
- Detailed analysis with severity ratings
- Two refactored implementations provided

### Problem 4
- Complete TypeScript implementation
- Detailed complexity analysis for each approach
- Performance benchmarks included

### Problem 5
- Full-stack CRUD API
- 88 unit tests, 84%+ coverage
- Layered architecture with separation of concerns
- Production-ready error handling

### Problem 6
- 1,200+ lines of technical specification
- Complete system architecture
- Security design (action tokens, rate limiting)
- Scalability strategies documented

---

## 📞 Notes

- Each problem can be run independently
- No shared dependencies between problems
- All problems include comprehensive documentation
- Production-ready code with best practices

---

**Status**: ✅ All 6 problems completed with comprehensive documentation and testing

**Last Updated**: December 3, 2025
