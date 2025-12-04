/**
 * Problem 4: Three Ways to Sum to n (TypeScript)
 *
 * NOTE: No validation for Number.MAX_SAFE_INTEGER overflow
 *
 * The problem statement guarantees: "this input will always produce a result
 * lesser than Number.MAX_SAFE_INTEGER"
 *
 * Therefore, we don't implement overflow checks or use BigInt for large numbers.
 * This keeps the implementations simple and performant as per the problem requirements.
 *
 * For reference: overflow would occur around n ≈ 134,217,728 (134 million)
 */

/**
 * Implementation A: Mathematical Formula
 *
 * COMPLEXITY ANALYSIS:
 * - Time Complexity: O(1) - Constant time
 *   The formula executes in a fixed number of operations regardless of input size.
 *   No loops or recursion, just arithmetic operations.
 *
 * - Space Complexity: O(1) - Constant space
 *   Only uses a fixed amount of memory for the calculation.
 *
 * EFFICIENCY:
 * - Most efficient solution for this problem
 * - Uses the arithmetic series formula: sum = n * (n + 1) / 2
 * - Optimal for all input sizes (even very large n)
 * - No iteration overhead
 *
 * TRADE-OFFS:
 * - Pros: Fastest execution, minimal memory
 * - Cons: Less intuitive for beginners, requires mathematical knowledge
 */
function sum_to_n_a(n: number): number {
    // Handle negative numbers: sum from n to -1 is negative of sum from 1 to |n|
    if (n < 0) {
        return -sum_to_n_a(-n);
    }

    // For positive numbers and zero, use the arithmetic series formula
    return (n * (n + 1)) / 2;
}

/**
 * Implementation B: Iterative Loop
 *
 * COMPLEXITY ANALYSIS:
 * - Time Complexity: O(n) - Linear time
 *   Must iterate through all numbers from 1 to n (or n to -1 for negative).
 *   Number of operations grows linearly with input size.
 *
 * - Space Complexity: O(1) - Constant space
 *   Only uses a single variable (sum) regardless of input size.
 *
 * EFFICIENCY:
 * - Moderate efficiency, acceptable for small to medium values of n
 * - Performance degrades linearly as n increases
 * - For n = 1,000,000: performs 1 million iterations
 *
 * TRADE-OFFS:
 * - Pros: Easy to understand, straightforward logic, no recursion stack
 * - Cons: Slower than formula approach, inefficient for large n
 */
function sum_to_n_b(n: number): number {
    let sum = 0;

    if (n >= 0) {
        // Positive case: sum from 1 to n
        for (let i = 1; i <= n; i++) {
            sum += i;
        }
    } else {
        // Negative case: sum from n to -1
        for (let i = n; i <= -1; i++) {
            sum += i;
        }
    }

    return sum;
}

/**
 * Implementation C: Recursive Approach
 *
 * COMPLEXITY ANALYSIS:
 * - Time Complexity: O(n) - Linear time
 *   Makes n recursive calls to reach the base case.
 *   Each call performs constant-time operations.
 *
 * - Space Complexity: O(n) - Linear space
 *   Uses call stack memory for recursion.
 *   Each recursive call adds a frame to the stack.
 *   For n = 10,000: creates 10,000 stack frames.
 *
 * EFFICIENCY:
 * - Least efficient due to call stack overhead
 * - Risk of stack overflow for very large n (typically ~10,000-100,000 depending on environment)
 * - Recursion adds overhead: function calls, stack frame allocation
 *
 * TRADE-OFFS:
 * - Pros: Elegant, demonstrates recursion concept, functional programming style
 * - Cons: Stack overflow risk, higher memory usage, slower than iterative approach
 *
 * NOTE: This is a tail-recursive implementation, but JavaScript/TypeScript engines
 * don't guarantee tail call optimization, so stack overflow is still a concern.
 */
function sum_to_n_c(n: number): number {
    // Base case
    if (n === 0) {
        return 0;
    }

    // Recursive case
    if (n > 0) {
        // Positive: sum = n + (n-1) + (n-2) + ... + 1
        return n + sum_to_n_c(n - 1);
    } else {
        // Negative: sum = n + (n+1) + (n+2) + ... + -1
        return n + sum_to_n_c(n + 1);
    }
}

// ===== TEST CASES =====

console.log('\n' + '='.repeat(70));
console.log('  TEST CASES - Basic Functionality');
console.log('='.repeat(70) + '\n');

console.log('📐 Testing sum_to_n_a (Mathematical Formula - O(1))');
console.log('-'.repeat(50));
console.log('  sum_to_n_a(5)   =', sum_to_n_a(5).toString().padStart(6));     // Expected: 15
console.log('  sum_to_n_a(0)   =', sum_to_n_a(0).toString().padStart(6));     // Expected: 0
console.log('  sum_to_n_a(-5)  =', sum_to_n_a(-5).toString().padStart(6));   // Expected: -15
console.log('  sum_to_n_a(100) =', sum_to_n_a(100).toString().padStart(6)); // Expected: 5050
console.log('');

console.log('🔁 Testing sum_to_n_b (Iterative Loop - O(n))');
console.log('-'.repeat(50));
console.log('  sum_to_n_b(5)   =', sum_to_n_b(5).toString().padStart(6));     // Expected: 15
console.log('  sum_to_n_b(0)   =', sum_to_n_b(0).toString().padStart(6));     // Expected: 0
console.log('  sum_to_n_b(-5)  =', sum_to_n_b(-5).toString().padStart(6));   // Expected: -15
console.log('  sum_to_n_b(100) =', sum_to_n_b(100).toString().padStart(6)); // Expected: 5050
console.log('');

console.log('♻️  Testing sum_to_n_c (Recursive - O(n) time + space)');
console.log('-'.repeat(50));
console.log('  sum_to_n_c(5)   =', sum_to_n_c(5).toString().padStart(6));     // Expected: 15
console.log('  sum_to_n_c(0)   =', sum_to_n_c(0).toString().padStart(6));     // Expected: 0
console.log('  sum_to_n_c(-5)  =', sum_to_n_c(-5).toString().padStart(6));   // Expected: -15
console.log('  sum_to_n_c(100) =', sum_to_n_c(100).toString().padStart(6)); // Expected: 5050
console.log('');

// ===== PERFORMANCE COMPARISON =====

console.log('\n' + '='.repeat(70));
console.log('  PERFORMANCE COMPARISON');
console.log('='.repeat(70) + '\n');

// Large value for formula and iterative (safe)
const largeValue = 10000;

console.log('⚡ Formula & Iterative (n = 10,000)');
console.log('-'.repeat(50));

// Test sum_to_n_a
console.log('\n  📐 Mathematical Formula (O(1)):');
console.time('     Time');
const resultA = sum_to_n_a(largeValue);
console.timeEnd('     Time');
console.log('     Result:', resultA.toLocaleString());

// Test sum_to_n_b
console.log('\n  🔁 Iterative Loop (O(n)):');
console.time('     Time');
const resultB = sum_to_n_b(largeValue);
console.timeEnd('     Time');
console.log('     Result:', resultB.toLocaleString());

// Smaller value for recursive to avoid stack overflow
const smallValue = 1000;

console.log('\n' + '-'.repeat(50));
console.log('\n♻️  Recursive (n = 1,000 - limited by stack)');
console.log('-'.repeat(50));

// Test sum_to_n_c (careful with stack size - use smaller n)
console.log('\n  ♻️  Recursive (O(n) time + space):');
console.time('     Time');
const resultC = sum_to_n_c(smallValue);
console.timeEnd('     Time');
console.log('     Result:', resultC.toLocaleString());

console.log('\n' + '='.repeat(70));
console.log('  ⚠️  IMPORTANT NOTE');
console.log('='.repeat(70));
console.log('\n  Recursive approach limited to n=1,000 to avoid stack overflow.');
console.log('  This demonstrates the O(n) space complexity issue.');
console.log('  Each recursive call adds a frame to the call stack.\n');
console.log('  For n=10,000: Stack overflow occurs! 💥');
console.log('  Recommendation: Use Mathematical Formula (O(1)) for best performance.\n');

// Export for use in other modules
export { sum_to_n_a, sum_to_n_b, sum_to_n_c };
