# Problem 4: Three Ways to Sum to n (TypeScript)

TypeScript implementation showcasing three different approaches to calculate the sum from 1 to n, with detailed complexity analysis.

## 📁 Structure

```
problem4/
├── README.md            # This file
├── challenge/
│   └── CHALLENGE.md     # Original problem statement
├── src/
│   └── solution.ts      # Three TypeScript implementations
├── tsconfig.json        # TypeScript config
└── package.json         # Dependencies
```

## 🚀 Quick Start

### Prerequisites

- Node.js (version 14 or higher recommended)
- npm (comes with Node.js)

### Installation

```bash
# Navigate to problem4 directory
cd src/problem4

# Install dependencies
npm install
```

### Running the Solution

**Recommended: Compile and Run**
```bash
npm test
```
This compiles TypeScript to JavaScript, then runs it.

**Alternative: Run Commands Separately**
```bash
npm run build   # Compiles TypeScript to dist/
npm start       # Runs compiled JavaScript
```

**Optional: Direct TypeScript Execution**
```bash
npm run dev
```
Runs TypeScript directly with ts-node (may show experimental warnings).

## 📋 Expected Output

```
=== Testing sum_to_n_a (Mathematical Formula) ===
sum_to_n_a(5) = 15
sum_to_n_a(0) = 0
sum_to_n_a(-5) = -15
sum_to_n_a(100) = 5050

=== Testing sum_to_n_b (Iterative Loop) ===
sum_to_n_b(5) = 15
sum_to_n_b(0) = 0
sum_to_n_b(-5) = -15
sum_to_n_b(100) = 5050

=== Testing sum_to_n_c (Recursive) ===
sum_to_n_c(5) = 15
sum_to_n_c(0) = 0
sum_to_n_c(-5) = -15
sum_to_n_c(100) = 5050

=== Performance Comparison (n = 10000) ===
sum_to_n_a: X.XXXms
sum_to_n_b: X.XXXms
sum_to_n_c: X.XXXms
```

## 💡 Implementation Details & Complexity Analysis

### sum_to_n_a: Mathematical Formula

**Complexity:**
- **Time**: O(1) - Constant time
- **Space**: O(1) - Constant space

**Approach:**
- Uses arithmetic series formula: `n * (n + 1) / 2`
- No loops or recursion

**Efficiency:**
- ✅ Most efficient solution
- ✅ Optimal for all input sizes
- ✅ No iteration overhead

**Trade-offs:**
- ✅ Fastest execution
- ✅ Minimal memory
- ❌ Less intuitive for beginners

---

### sum_to_n_b: Iterative Loop

**Complexity:**
- **Time**: O(n) - Linear time
- **Space**: O(1) - Constant space

**Approach:**
- Traditional for loop summing from 1 to n
- Single accumulator variable

**Efficiency:**
- ⚠️ Moderate efficiency
- ⚠️ Performance degrades linearly with n
- ✅ Better than recursive for large n (no stack overflow risk)

**Trade-offs:**
- ✅ Easy to understand
- ✅ No recursion stack
- ❌ Slower than formula approach
- ❌ Inefficient for large n

---

### sum_to_n_c: Recursive Approach

**Complexity:**
- **Time**: O(n) - Linear time
- **Space**: O(n) - Linear space (call stack)

**Approach:**
- Recursive function calling itself n times
- Each call adds to call stack

**Efficiency:**
- ❌ Least efficient solution
- ❌ Stack overflow risk for large n (~10,000+)
- ❌ Function call overhead

**Trade-offs:**
- ✅ Elegant, functional style
- ✅ Demonstrates recursion concept
- ❌ Stack overflow risk
- ❌ Higher memory usage
- ❌ Slower than iterative

**Note:** JavaScript/TypeScript doesn't guarantee tail call optimization, so stack overflow is a real concern.

---

## 📊 Performance Comparison

For n = 10,000:

| Implementation | Time Complexity | Space Complexity | Typical Speed | Stack Risk  |
|----------------|-----------------|------------------|---------------|-------------|
| sum_to_n_a     | O(1)            | O(1)             | ~0.001ms      | None        |
| sum_to_n_b     | O(n)            | O(1)             | ~0.1ms        | None        |
| sum_to_n_c     | O(n)            | O(n)             | ~1ms          | High (>10k) |

## 🔧 Using the Functions

Import and use in your TypeScript code:

```typescript
import { sum_to_n_a, sum_to_n_b, sum_to_n_c } from './solution';

// Use the most efficient one
console.log(sum_to_n_a(1000));  // Fast: O(1)

// Or the iterative approach
console.log(sum_to_n_b(1000));  // Moderate: O(n)

// Recursive (be careful with large n)
console.log(sum_to_n_c(100));   // Slow: O(n) time + space
```

## 📝 Implementation Notes

### Type Safety
- Full TypeScript type annotations
- Strict type checking enabled
- Function signatures clearly defined

### Edge Cases Handled
- **Positive numbers**: Standard summation
- **Zero**: Returns 0
- **Negative numbers**: Sums from n to -1

### No Overflow Validation

Per the problem statement:
> "Assuming this input will always produce a result lesser than `Number.MAX_SAFE_INTEGER`"

Therefore, no overflow checks or BigInt implementation. Overflow would occur around n ≈ 134,217,728.

### Differences from Problem 1

This is the **TypeScript version** of Problem 1 with these additions:
- ✅ Type annotations (`n: number`, `: number`)
- ✅ Detailed complexity comments for each function
- ✅ Performance comparison tests
- ✅ TypeScript compilation setup

## 🎯 Key Takeaways

1. **Formula approach (A)** is always best for this problem
2. **Iterative (B)** is acceptable and easy to understand
3. **Recursive (C)** is elegant but impractical for large inputs
4. Always consider time/space complexity trade-offs
5. TypeScript provides type safety without performance cost

---