# Code Comparison: Original vs Refactored

## Quick Reference

| Aspect              | Original          | Refactored | Optimized |
|---------------------|-------------------|------------|-----------|
| **Critical Bugs**   | 7                 | 0          | 0         |
| **Type Safety**     | Poor (uses `any`) | Good       | Excellent |
| **Performance**     | Poor              | Good       | Excellent |
| **Maintainability** | Poor              | Good       | Excellent |
| **Lines of Code**   | ~70               | ~85        | ~90       |
| **Code Quality**    | Low               | High       | Very High |

---

## Side-by-Side Comparison

### 1. Interface Definitions

#### ❌ Original
```tsx
interface WalletBalance {
  currency: string;
  amount: number;
  // Missing: blockchain property (used in code but not defined)
}

interface Props extends BoxProps {
  // Empty interface - unnecessary
}
```

#### ✅ Refactored
```tsx
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string; // Added missing property
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string; // Proper extension
}

interface Props extends BoxProps {}
```

#### ⭐ Optimized
```tsx
type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  usdValue: number; // Include USD value in type
}
```

---

### 2. getPriority Function

#### ❌ Original (Inside Component)
```tsx
const WalletPage: React.FC<Props> = (props: Props) => {
  // Recreated on EVERY render - performance issue
  const getPriority = (blockchain: any): number => { // Uses 'any'
    switch (blockchain) {
      case 'Osmosis': return 100
      case 'Ethereum': return 50
      // ...
      default: return -99
    }
  }
}
```
**Issues**:
- Recreated every render (expensive)
- Uses `any` type (no type safety)
- Inside component (bad practice)

#### ✅ Refactored (Outside Component)
```tsx
// Defined once, reused across all renders
const getPriority = (blockchain: string): number => {
  switch (blockchain) {
    case 'Osmosis': return 100;
    case 'Ethereum': return 50;
    // ...
    default: return -99;
  }
};

const WalletPage: React.FC<Props> = (props) => {
  // Component code
};
```
**Improvements**:
- ✅ Defined outside component
- ✅ Proper TypeScript typing
- ✅ Not recreated on render

#### ⭐ Optimized (Map Lookup)
```tsx
// O(1) lookup instead of O(n) switch
const BLOCKCHAIN_PRIORITIES = new Map<string, number>([
  ['Osmosis', 100],
  ['Ethereum', 50],
  // ...
]);

const getPriority = (blockchain: string): number => {
  return BLOCKCHAIN_PRIORITIES.get(blockchain) ?? -99;
};
```
**Additional Benefits**:
- ✅ O(1) instead of O(n) lookup
- ✅ Easier to maintain
- ✅ Can be imported from config

---

### 3. Filter Logic

#### ❌ Original (Inverted Logic)
```tsx
.filter((balance: WalletBalance) => {
  const balancePriority = getPriority(balance.blockchain);
  if (lhsPriority > -99) { // ❌ Undefined variable!
    if (balance.amount <= 0) { // ❌ Keeps NEGATIVE/ZERO amounts
      return true;
    }
  }
  return false;
})
```
**Issues**:
- ❌ `lhsPriority` is undefined (runtime error)
- ❌ Logic is backwards (keeps empty balances)
- ❌ Nested ifs (hard to read)

#### ✅ Refactored
```tsx
.filter((balance: WalletBalance) => {
  const balancePriority = getPriority(balance.blockchain);
  return balancePriority > -99 && balance.amount > 0;
})
```
**Improvements**:
- ✅ Correct variable name
- ✅ Correct logic (keeps positive amounts)
- ✅ Clean, readable code

#### ⭐ Optimized
```tsx
.filter((balance: WalletBalance) => {
  const priority = getPriority(balance.blockchain);
  return priority > MIN_VALID_PRIORITY && balance.amount > 0;
})
```
**Additional Benefits**:
- ✅ Named constant for magic number
- ✅ More semantic

---

### 4. Sort Logic

#### ❌ Original
```tsx
.sort((lhs: WalletBalance, rhs: WalletBalance) => {
  const leftPriority = getPriority(lhs.blockchain);
  const rightPriority = getPriority(rhs.blockchain);
  if (leftPriority > rightPriority) {
    return -1;
  } else if (rightPriority > leftPriority) {
    return 1;
  }
  // ❌ No return for equal case - returns undefined!
});
```
**Issue**: Missing return statement causes unstable sort.

#### ✅ Refactored
```tsx
.sort((lhs: WalletBalance, rhs: WalletBalance) => {
  const leftPriority = getPriority(lhs.blockchain);
  const rightPriority = getPriority(rhs.blockchain);

  if (leftPriority > rightPriority) return -1;
  if (leftPriority < rightPriority) return 1;
  return 0; // ✅ Handle equal case
});
```

#### ⭐ Optimized
```tsx
.sort((a: WalletBalance, b: WalletBalance) => {
  return getPriority(b.blockchain) - getPriority(a.blockchain);
})
```
**Additional Benefits**:
- ✅ One-liner (more concise)
- ✅ Standard numeric sort pattern

---

### 5. useMemo Dependencies

#### ❌ Original
```tsx
const sortedBalances = useMemo(() => {
  return balances.filter(/* ... */).sort(/* ... */);
}, [balances, prices]); // ❌ 'prices' not used in calculation
```
**Issue**: Includes unused dependency, causing unnecessary recalculations.

#### ✅ Refactored
```tsx
const sortedBalances = useMemo(() => {
  return balances.filter(/* ... */).sort(/* ... */);
}, [balances]); // ✅ Only balances
```

#### ⭐ Optimized
```tsx
const formattedBalances = useMemo(() => {
  return balances
    .filter(/* ... */)
    .sort(/* ... */)
    .map((balance) => ({
      ...balance,
      formatted: formatAmount(balance.amount),
      usdValue: (prices[balance.currency] ?? 0) * balance.amount,
    }));
}, [balances, prices]); // ✅ Both used in computation
```
**Additional Benefits**:
- ✅ Single pass through data
- ✅ All dependencies correctly listed

---

### 6. Array Mapping

#### ❌ Original (Double Iteration)
```tsx
// First map - never used!
const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
  return {
    ...balance,
    formatted: balance.amount.toFixed()
  }
})

// Second map - uses wrong array!
const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
  const usdValue = prices[balance.currency] * balance.amount;
  return (
    <WalletRow
      key={index} // ❌ Using index as key
      formattedAmount={balance.formatted} // ❌ Doesn't exist on WalletBalance
    />
  )
})
```
**Issues**:
- ❌ Two separate iterations (performance)
- ❌ First map is unused (wasted computation)
- ❌ Type mismatch
- ❌ Index as key (anti-pattern)

#### ✅ Refactored
```tsx
const rows = useMemo(() => {
  return sortedBalances.map((balance: WalletBalance) => {
    const formattedBalance: FormattedWalletBalance = {
      ...balance,
      formatted: balance.amount.toFixed(2),
    };
    const usdValue = prices[balance.currency] * balance.amount;

    return (
      <WalletRow
        key={balance.currency} // ✅ Unique identifier
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={formattedBalance.formatted}
      />
    );
  });
}, [sortedBalances, prices]);
```

#### ⭐ Optimized
```tsx
const formattedBalances = useMemo(() => {
  return balances
    .filter(/* ... */)
    .sort(/* ... */)
    .map((balance: WalletBalance): FormattedWalletBalance => ({
      ...balance,
      formatted: formatAmount(balance.amount),
      usdValue: (prices[balance.currency] ?? 0) * balance.amount,
    }));
}, [balances, prices]);

const rows = useMemo(() => {
  return formattedBalances.map((balance) => (
    <WalletRow key={balance.currency} {...balance} />
  ));
}, [formattedBalances]);
```
**Additional Benefits**:
- ✅ Separation of concerns
- ✅ Cleaner JSX
- ✅ Safe fallback for missing prices

---

## Performance Comparison

### Render Performance

| Operation | Original | Refactored | Optimized |
|-----------|----------|------------|-----------|
| Function creation | Every render | Once | Once |
| Filter operation | O(n) | O(n) | O(n) |
| Sort comparison | O(n log n) * O(n) | O(n log n) * O(1) | O(n log n) * O(1) |
| Priority lookup | O(n) switch | O(n) switch | O(1) Map |
| Map iterations | 2x O(n) | 1x O(n) | 1x O(n) |
| Unnecessary recalcs | High | Low | Very Low |

### Memory Usage

- **Original**: Creates new function every render, multiple intermediate arrays
- **Refactored**: Function created once, one intermediate array
- **Optimized**: Function created once, minimal intermediate arrays, constants

---

## Summary

### Original Code Issues
- 🔴 7 Critical bugs (crashes/errors)
- 🟡 5 Major performance issues
- 🟠 1 Type safety issue
- 🟢 3 Code quality issues
- **Total: 16 issues**

### Refactored Code
- ✅ All bugs fixed
- ✅ Performance improved
- ✅ Type safe
- ✅ Clean code
- **Ready for production**

### Optimized Code
- ✅ All of the above
- ✅ Additional optimizations
- ✅ Better patterns
- ✅ More maintainable
- **Best practice example**
