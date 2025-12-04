# Problem 3: Code Review Analysis - Messy React

## Overview
This document provides a comprehensive analysis of computational inefficiencies, anti-patterns, and bugs found in the WalletPage component.

---

## Critical Issues (Bugs)

### 1. **Undefined Variable: `lhsPriority`**
**Location**: Line 42 in `useMemo` filter function
**Severity**: 🔴 Critical - Runtime Error

```tsx
const balancePriority = getPriority(balance.blockchain);
if (lhsPriority > -99) {  // ❌ lhsPriority is undefined
```

**Issue**: Variable `lhsPriority` is referenced but never defined. Should be `balancePriority`.

**Impact**: This will throw a ReferenceError at runtime, breaking the entire component.

**Fix**:
```tsx
if (balancePriority > -99) {  // ✅ Use the correct variable
```

---

### 2. **Missing `blockchain` Property in Interface**
**Location**: `WalletBalance` interface
**Severity**: 🔴 Critical - TypeScript Error

```tsx
interface WalletBalance {
  currency: string;
  amount: number;
  // ❌ Missing: blockchain property
}
```

**Issue**: Code uses `balance.blockchain` but the interface doesn't define this property.

**Impact**: TypeScript compilation error.

**Fix**:
```tsx
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;  // ✅ Add missing property
}
```

---

### 3. **Inverted Filter Logic**
**Location**: Line 43-46 in `useMemo`
**Severity**: 🔴 Critical - Logic Bug

```tsx
if (balancePriority > -99) {
  if (balance.amount <= 0) {  // ❌ Returns balances with zero or negative amounts
    return true;
  }
}
return false
```

**Issue**: Filter keeps balances with `amount <= 0` and discards positive amounts. This is backwards.

**Impact**: Users see empty/negative balances instead of their actual holdings.

**Fix**:
```tsx
return balancePriority > -99 && balance.amount > 0;  // ✅ Keep positive balances only
```

---

### 4. **Type Mismatch in `rows` Mapping**
**Location**: Line 60
**Severity**: 🔴 Critical - Type Error

```tsx
const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
  // ❌ sortedBalances is WalletBalance[], not FormattedWalletBalance[]
  const usdValue = prices[balance.currency] * balance.amount;
  return (
    <WalletRow
      formattedAmount={balance.formatted}  // ❌ .formatted doesn't exist
    />
  )
})
```

**Issue**:
- `sortedBalances` is typed as `WalletBalance[]` but annotated as `FormattedWalletBalance`
- Attempts to access `balance.formatted` which doesn't exist on `WalletBalance`

**Impact**: Runtime error when trying to access undefined property.

**Fix**: Use `formattedBalances` instead of `sortedBalances`, or combine the operations.

---

### 5. **Unused Variable: `formattedBalances`**
**Location**: Line 56-61
**Severity**: 🟡 Major - Code Inefficiency

```tsx
const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
  return {
    ...balance,
    formatted: balance.amount.toFixed()
  }
})
// ❌ This variable is computed but never used
```

**Issue**: `formattedBalances` is created but then `rows` uses `sortedBalances` instead.

**Impact**: Wasted computation on every render.

---

### 6. **Array Index as React Key**
**Location**: Line 63
**Severity**: 🟡 Major - React Anti-pattern

```tsx
<WalletRow
  key={index}  // ❌ Using index as key
  amount={balance.amount}
/>
```

**Issue**: Using array index as key is an anti-pattern when list can be reordered/filtered.

**Impact**:
- React can't properly track components
- Can cause state bugs and poor performance
- Unnecessary re-renders

**Fix**:
```tsx
<WalletRow
  key={balance.currency}  // ✅ Use unique identifier
/>
```

---

### 7. **Undefined Variable: `classes`**
**Location**: Line 64
**Severity**: 🔴 Critical - Runtime Error

```tsx
<WalletRow
  className={classes.row}  // ❌ classes is undefined
/>
```

**Issue**: `classes` variable is used but never defined or imported.

**Impact**: Runtime error.

**Fix**: Import or define `classes`, or remove if not needed.

---

## Performance Issues

### 8. **Function Recreated on Every Render**
**Location**: `getPriority` function
**Severity**: 🟡 Major - Performance Issue

```tsx
const WalletPage: React.FC<Props> = (props: Props) => {
  // ❌ This function is recreated on every render
  const getPriority = (blockchain: any): number => {
    switch (blockchain) {
      // ...
    }
  }
```

**Issue**: `getPriority` is redefined on every component render.

**Impact**:
- Unnecessary memory allocation
- Makes `useMemo` less effective
- Called multiple times in filter and sort

**Fix**: Move outside component or use `useCallback`
```tsx
// ✅ Define outside component (best solution)
const getPriority = (blockchain: string): number => {
  switch (blockchain) {
    // ...
  }
}

const WalletPage: React.FC<Props> = (props: Props) => {
  // ...
}
```

---

### 9. **Incorrect `useMemo` Dependencies**
**Location**: Line 40
**Severity**: 🟡 Major - Performance Issue

```tsx
const sortedBalances = useMemo(() => {
  return balances.filter(/* ... */).sort(/* ... */);
}, [balances, prices]);  // ❌ prices is not used in computation
```

**Issue**:
- `prices` is in dependency array but never used in the memoized calculation
- This causes unnecessary recalculation when prices change

**Impact**: Component recalculates sortedBalances even when only prices change, wasting CPU.

**Fix**:
```tsx
}, [balances]);  // ✅ Only include actually used dependencies
```

---

### 10. **Multiple Array Iterations**
**Location**: Lines 56-70
**Severity**: 🟡 Major - Performance Issue

```tsx
// ❌ First map: create formattedBalances (unused)
const formattedBalances = sortedBalances.map(/* ... */);

// ❌ Second map: create rows
const rows = sortedBalances.map(/* ... */);
```

**Issue**: Two separate `.map()` operations when one would suffice.

**Impact**:
- Double iteration over the same array
- O(2n) instead of O(n)

**Fix**: Combine into single map operation in JSX or create one intermediate variable.

---

### 11. **Missing Return in Sort Comparator**
**Location**: Lines 48-54
**Severity**: 🟡 Major - Logic Bug

```tsx
.sort((lhs: WalletBalance, rhs: WalletBalance) => {
  const leftPriority = getPriority(lhs.blockchain);
  const rightPriority = getPriority(rhs.blockchain);
  if (leftPriority > rightPriority) {
    return -1;
  } else if (rightPriority > leftPriority) {
    return 1;
  }
  // ❌ No return statement for equal priorities - returns undefined
});
```

**Issue**: When priorities are equal, function returns `undefined` instead of `0`.

**Impact**: Unstable sort behavior, inconsistent ordering.

**Fix**:
```tsx
if (leftPriority > rightPriority) return -1;
if (leftPriority < rightPriority) return 1;
return 0;  // ✅ Handle equal case
```

---

## TypeScript Anti-patterns

### 12. **Using `any` Type**
**Location**: `getPriority` parameter
**Severity**: 🟠 Medium - Type Safety Issue

```tsx
const getPriority = (blockchain: any): number => {
  // ❌ any defeats TypeScript's purpose
```

**Issue**: Using `any` removes all type checking benefits.

**Impact**: No compile-time safety, potential runtime errors.

**Fix**:
```tsx
const getPriority = (blockchain: string): number => {  // ✅ Use proper type
```

---

### 13. **Empty Interface**
**Location**: `Props` interface
**Severity**: 🟢 Minor - Code Quality

```tsx
interface Props extends BoxProps {
  // ❌ Empty interface, just use BoxProps directly
}
```

**Issue**: Unnecessary interface that adds no value.

**Impact**: Code clutter, maintenance overhead.

**Fix**:
```tsx
const WalletPage: React.FC<BoxProps> = (props: BoxProps) => {
  // ✅ Use BoxProps directly, or add actual props if needed
```

---

### 14. **Redundant Type Annotation**
**Location**: Component props
**Severity**: 🟢 Minor - Code Quality

```tsx
const WalletPage: React.FC<Props> = (props: Props) => {
  // ❌ Redundant: Props is already in React.FC<Props>
```

**Issue**: Type is specified twice unnecessarily.

**Fix**:
```tsx
const WalletPage: React.FC<Props> = (props) => {  // ✅ Type inferred
```

---

## Code Quality Issues

### 15. **Unused Destructured Variable**
**Location**: Line 38
**Severity**: 🟢 Minor - Code Quality

```tsx
const { children, ...rest } = props;
// ❌ children is extracted but never used
```

**Issue**: `children` is destructured but not referenced anywhere.

**Impact**: Dead code, confusing for maintainers.

**Fix**:
```tsx
const { ...rest } = props;  // ✅ Remove unused variable
```

---

### 16. **Inconsistent Formatting**
**Location**: Throughout the file
**Severity**: 🟢 Minor - Code Quality

```tsx
    const getPriority = (blockchain: any): number => {  // ❌ Inconsistent indentation
```

**Issue**: Inconsistent spacing and indentation throughout.

**Impact**: Reduced readability, harder to maintain.

**Fix**: Use Prettier or ESLint to enforce consistent formatting.

---

## Summary

### Issues by Severity:
- 🔴 **Critical (7)**: Runtime errors and TypeScript errors that prevent code from working
- 🟡 **Major (5)**: Performance issues and logic bugs that impact functionality
- 🟠 **Medium (1)**: Type safety issues
- 🟢 **Minor (3)**: Code quality and maintainability issues

### Total Issues Found: **16**

### Key Recommendations:
1. Fix all critical bugs (undefined variables, missing properties, inverted logic)
2. Move `getPriority` outside component
3. Combine array operations into single iteration
4. Use proper TypeScript types (no `any`)
5. Use stable keys for React lists
6. Fix useMemo dependencies
7. Remove dead code

### Estimated Refactoring Effort:
- **Time**: 15-30 minutes for an experienced developer
- **Complexity**: Low-Medium
- **Testing Required**: Unit tests for filter/sort logic, integration tests for rendering
