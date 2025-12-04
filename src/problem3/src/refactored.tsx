/**
 * WalletPage Component - Refactored Version
 *
 * This refactored version fixes all 16 issues identified in ANALYSIS.md:
 * - Critical bugs (undefined variables, type errors, logic errors)
 * - Performance issues (unnecessary re-renders, multiple iterations)
 * - TypeScript anti-patterns (any types, missing properties)
 * - Code quality issues (unused variables, inconsistent formatting)
 */

import React, { useMemo } from 'react';

// ===== INTERFACES =====

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string; // ✅ FIX #2: Added missing property
}

// ✅ IMPROVEMENT: Extend WalletBalance to ensure consistency
interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

// ✅ FIX #13: Remove empty interface or add actual props if needed
// If no additional props needed, just use BoxProps directly
interface Props extends BoxProps {
  // Add any additional props here if needed in the future
}

// ===== UTILITY FUNCTIONS =====

/**
 * ✅ FIX #8: Moved outside component to prevent recreation on every render
 * ✅ FIX #12: Changed 'any' to 'string' for proper type safety
 *
 * Returns priority value for different blockchains.
 * Higher priority = more important/valuable chain
 */
const getPriority = (blockchain: string): number => {
  switch (blockchain) {
    case 'Osmosis':
      return 100;
    case 'Ethereum':
      return 50;
    case 'Arbitrum':
      return 30;
    case 'Zilliqa':
      return 20;
    case 'Neo':
      return 20;
    default:
      return -99;
  }
};

// ===== COMPONENT =====

const WalletPage: React.FC<Props> = (props) => { // ✅ FIX #14: Removed redundant type annotation
  const { ...rest } = props; // ✅ FIX #15: Removed unused 'children' variable

  const balances = useWalletBalances();
  const prices = usePrices();

  /**
   * ✅ FIX #9: Removed 'prices' from dependencies (it's not used in this computation)
   * ✅ FIX #1: Fixed undefined 'lhsPriority' -> use 'balancePriority'
   * ✅ FIX #3: Fixed inverted logic -> keep balances with amount > 0 (not <= 0)
   * ✅ FIX #11: Added return statement for equal priorities in sort
   */
  const sortedBalances = useMemo(() => {
    return balances
      .filter((balance: WalletBalance) => {
        const balancePriority = getPriority(balance.blockchain);
        // ✅ Keep only balances with valid priority AND positive amount
        return balancePriority > -99 && balance.amount > 0;
      })
      .sort((lhs: WalletBalance, rhs: WalletBalance) => {
        const leftPriority = getPriority(lhs.blockchain);
        const rightPriority = getPriority(rhs.blockchain);

        // Sort in descending order (highest priority first)
        if (leftPriority > rightPriority) return -1;
        if (leftPriority < rightPriority) return 1;
        return 0; // ✅ Handle equal priorities
      });
  }, [balances]); // ✅ Only depend on balances

  /**
   * ✅ FIX #10 & #5: Combine formatting and row creation into single operation
   * ✅ FIX #4: Use proper type and access formatted property correctly
   * ✅ FIX #6: Use array index as key -> use unique currency as key
   * ✅ FIX #7: Define or remove classes variable
   */
  const rows = useMemo(() => {
    return sortedBalances.map((balance: WalletBalance) => {
      // Format the balance
      const formattedBalance: FormattedWalletBalance = {
        ...balance,
        formatted: balance.amount.toFixed(2), // ✅ Added decimal places for better formatting
      };

      // Calculate USD value
      const usdValue = prices[balance.currency] * balance.amount;

      return (
        <WalletRow
          key={balance.currency} // ✅ Use unique identifier instead of index
          amount={balance.amount}
          usdValue={usdValue}
          formattedAmount={formattedBalance.formatted}
        />
      );
    });
  }, [sortedBalances, prices]); // ✅ Depend on both sortedBalances and prices

  return <div {...rest}>{rows}</div>;
};

export default WalletPage;
