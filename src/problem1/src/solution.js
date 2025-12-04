/**
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

// Implementation A: Mathematical Formula (O(1))
// Uses the arithmetic series formula: sum = n * (n + 1) / 2
var sum_to_n_a = function(n) {
    // Handle negative numbers: sum from n to -1 is negative of sum from 1 to |n|
    if (n < 0) {
        return -sum_to_n_a(-n);
    }
    // For positive numbers and zero, use the formula
    return n * (n + 1) / 2;
};

// Implementation B: Iterative Loop (O(n))
// Traditional for loop approach
var sum_to_n_b = function(n) {
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
};

// Implementation C: Functional Approach (O(n))
// Uses Array.from() with reduce for a functional programming style
var sum_to_n_c = function(n) {
    if (n === 0) return 0;

    if (n > 0) {
        // Create array [1, 2, 3, ..., n] and reduce
        return Array.from({ length: n }, (_, i) => i + 1)
            .reduce((acc, curr) => acc + curr, 0);
    } else {
        // Create array [n, n+1, ..., -2, -1] and reduce
        return Array.from({ length: Math.abs(n) }, (_, i) => n + i)
            .reduce((acc, curr) => acc + curr, 0);
    }
};

// Test cases
console.log('Testing sum_to_n_a:');
console.log('sum_to_n_a(5) =', sum_to_n_a(5)); // Expected: 15
console.log('sum_to_n_a(0) =', sum_to_n_a(0)); // Expected: 0
console.log('sum_to_n_a(-5) =', sum_to_n_a(-5)); // Expected: -15

console.log('\nTesting sum_to_n_b:');
console.log('sum_to_n_b(5) =', sum_to_n_b(5)); // Expected: 15
console.log('sum_to_n_b(0) =', sum_to_n_b(0)); // Expected: 0
console.log('sum_to_n_b(-5) =', sum_to_n_b(-5)); // Expected: -15

console.log('\nTesting sum_to_n_c:');
console.log('sum_to_n_c(5) =', sum_to_n_c(5)); // Expected: 15
console.log('sum_to_n_c(0) =', sum_to_n_c(0)); // Expected: 0
console.log('sum_to_n_c(-5) =', sum_to_n_c(-5)); // Expected: -15
