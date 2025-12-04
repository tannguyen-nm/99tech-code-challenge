/**
 * WalletPage Component - Optimized Version
 *
 * This version includes all fixes from refactored.tsx PLUS additional optimizations:
 * - Better memoization strategy
 * - More efficient data processing
 * - Enhanced TypeScript typing
 * - Improved error handling
 */

import React, { useMemo } from 'react';

// ===== TYPES & INTERFACES =====

type Blockchain = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  usdValue: number;
}

interface Props extends BoxProps {}

// ===== CONSTANTS =====

/**
 * Priority mapping for blockchains
 * Using a Map for O(1) lookup instead of switch statement
 */
const BLOCKCHAIN_PRIORITIES = new Map<string, number>([
  ['Osmosis', 100],
  ['Ethereum', 50],
  ['Arbitrum', 30],
  ['Zilliqa', 20],
  ['Neo', 20],
]);

const DEFAULT_PRIORITY = -99;
const MIN_VALID_PRIORITY = -99;

// ===== UTILITY FUNCTIONS =====

/**
 * Get blockchain priority with type safety
 * Uses Map for O(1) lookup instead of switch O(n)
 */
const getPriority = (blockchain: string): number => {
  return BLOCKCHAIN_PRIORITIES.get(blockchain) ?? DEFAULT_PRIORITY;
};

/**
 * Format balance amount consistently
 */
const formatAmount = (amount: number): string => {
  return amount.toFixed(2);
};

// ===== COMPONENT =====

const WalletPage: React.FC<Props> = (props) => {
  const { ...rest } = props;

  const balances = useWalletBalances();
  const prices = usePrices();

  /**
   * OPTIMIZATION: Single pass through data - filter, sort, and format in one useMemo
   * This is more efficient than multiple operations
   */
  const formattedBalances = useMemo(() => {
    return (
      balances
        // Step 1: Filter valid balances
        .filter((balance: WalletBalance) => {
          const priority = getPriority(balance.blockchain);
          return priority > MIN_VALID_PRIORITY && balance.amount > 0;
        })
        // Step 2: Sort by priority (descending)
        .sort((a: WalletBalance, b: WalletBalance) => {
          return getPriority(b.blockchain) - getPriority(a.blockchain);
        })
        // Step 3: Format balances with USD value
        .map(
          (balance: WalletBalance): FormattedWalletBalance => ({
            ...balance,
            formatted: formatAmount(balance.amount),
            usdValue: (prices[balance.currency] ?? 0) * balance.amount, // Safe fallback
          })
        )
    );
  }, [balances, prices]); // Both dependencies are actually used

  /**
   * Render rows from formatted balances
   * Separated from data processing for clarity
   */
  const rows = useMemo(() => {
    return formattedBalances.map((balance: FormattedWalletBalance) => (
      <WalletRow
        key={balance.currency}
        amount={balance.amount}
        usdValue={balance.usdValue}
        formattedAmount={balance.formatted}
      />
    ));
  }, [formattedBalances]);

  return <div {...rest}>{rows}</div>;
};

export default WalletPage;

/**
 * ALTERNATIVE APPROACH: Single useMemo with direct JSX rendering
 * Even more optimized - eliminates the intermediate 'rows' variable
 */
export const WalletPageAlternative: React.FC<Props> = (props) => {
  const { ...rest } = props;

  const balances = useWalletBalances();
  const prices = usePrices();

  const rows = useMemo(() => {
    return balances
      .filter((balance: WalletBalance) => {
        const priority = getPriority(balance.blockchain);
        return priority > MIN_VALID_PRIORITY && balance.amount > 0;
      })
      .sort((a: WalletBalance, b: WalletBalance) => {
        return getPriority(b.blockchain) - getPriority(a.blockchain);
      })
      .map((balance: WalletBalance) => {
        const formatted = formatAmount(balance.amount);
        const usdValue = (prices[balance.currency] ?? 0) * balance.amount;

        return (
          <WalletRow
            key={balance.currency}
            amount={balance.amount}
            usdValue={usdValue}
            formattedAmount={formatted}
          />
        );
      });
  }, [balances, prices]);

  return <div {...rest}>{rows}</div>;
};
