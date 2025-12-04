/**
 * Fancy Swap Form - Currency Exchange Application
 * Fetches token prices and enables swapping between different tokens
 */

// State management
const state = {
  tokens: [],
  fromToken: null,
  toToken: null,
  currentSelector: null, // 'from' or 'to'
};

// DOM Elements
const elements = {
  fromAmount: document.getElementById('from-amount'),
  toAmount: document.getElementById('to-amount'),
  fromTokenSelector: document.getElementById('from-token-selector'),
  toTokenSelector: document.getElementById('to-token-selector'),
  fromTokenIcon: document.getElementById('from-token-icon'),
  toTokenIcon: document.getElementById('to-token-icon'),
  fromTokenSymbol: document.getElementById('from-token-symbol'),
  toTokenSymbol: document.getElementById('to-token-symbol'),
  swapDirectionBtn: document.getElementById('swap-direction-btn'),
  submitBtn: document.getElementById('submit-btn'),
  btnText: document.querySelector('.btn-text'),
  loader: document.querySelector('.loader'),
  exchangeRate: document.getElementById('exchange-rate'),
  errorMessage: document.getElementById('from-amount-error'),
  successMessage: document.getElementById('success-message'),
  modal: document.getElementById('token-modal'),
  tokenList: document.getElementById('token-list'),
  tokenSearch: document.getElementById('token-search'),
  closeModal: document.getElementById('close-modal'),
  form: document.getElementById('swap-form'),
};

/**
 * Fetch token prices from API and initialize app
 */
async function initializeApp() {
  try {
    const response = await fetch('https://interview.switcheo.com/prices.json');
    const prices = await response.json();

    // Process tokens: group by currency, get latest price, filter out tokens without prices
    const tokenMap = new Map();

    prices.forEach(item => {
      if (item.price > 0) {
        const existing = tokenMap.get(item.currency);
        if (!existing || item.date > existing.date) {
          tokenMap.set(item.currency, {
            currency: item.currency,
            price: parseFloat(item.price),
            date: item.date,
          });
        }
      }
    });

    // Convert to array and sort alphabetically
    state.tokens = Array.from(tokenMap.values())
      .sort((a, b) => a.currency.localeCompare(b.currency));

    console.log(`Loaded ${state.tokens.length} tokens with prices`);
  } catch (error) {
    console.error('Error fetching token prices:', error);
    elements.errorMessage.textContent = 'Error loading tokens. Please refresh the page.';
  }
}

/**
 * Get token icon URL
 */
function getTokenIconUrl(currency) {
  return `https://raw.githubusercontent.com/Switcheo/token-icons/main/tokens/${currency}.svg`;
}

/**
 * Open token selector modal
 */
function openTokenModal(selector) {
  state.currentSelector = selector;
  renderTokenList(state.tokens);
  elements.modal.style.display = 'flex';
  elements.tokenSearch.value = '';
  elements.tokenSearch.focus();
}

/**
 * Close token selector modal
 */
function closeTokenModal() {
  elements.modal.style.display = 'none';
  state.currentSelector = null;
}

/**
 * Render token list in modal
 */
function renderTokenList(tokens) {
  elements.tokenList.innerHTML = '';

  tokens.forEach(token => {
    const tokenItem = document.createElement('div');
    tokenItem.className = 'token-item';
    tokenItem.innerHTML = `
      <img src="${getTokenIconUrl(token.currency)}" alt="${token.currency}" onerror="this.style.display='none'">
      <div class="token-item-info">
        <div class="token-item-symbol">${token.currency}</div>
        <div class="token-item-price">$${token.price.toFixed(6)}</div>
      </div>
    `;

    tokenItem.addEventListener('click', () => selectToken(token));
    elements.tokenList.appendChild(tokenItem);
  });
}

/**
 * Select a token
 */
function selectToken(token) {
  if (state.currentSelector === 'from') {
    state.fromToken = token;
    elements.fromTokenIcon.src = getTokenIconUrl(token.currency);
    elements.fromTokenSymbol.textContent = token.currency;
  } else {
    state.toToken = token;
    elements.toTokenIcon.src = getTokenIconUrl(token.currency);
    elements.toTokenSymbol.textContent = token.currency;
  }

  closeTokenModal();
  calculateExchange();
  updateSubmitButton();
}

/**
 * Calculate exchange amount and rate
 */
function calculateExchange() {
  if (!state.fromToken || !state.toToken) {
    elements.toAmount.value = '';
    elements.exchangeRate.textContent = '';
    return;
  }

  const fromAmount = parseFloat(elements.fromAmount.value);

  if (!fromAmount || fromAmount <= 0) {
    elements.toAmount.value = '';
    elements.exchangeRate.textContent = '';
    return;
  }

  // Calculate exchange: (fromAmount * fromTokenPrice) / toTokenPrice
  const rate = state.fromToken.price / state.toToken.price;
  const toAmount = fromAmount * rate;

  elements.toAmount.value = toAmount.toFixed(6);
  elements.exchangeRate.textContent = `1 ${state.fromToken.currency} = ${rate.toFixed(6)} ${state.toToken.currency}`;
}

/**
 * Validate input
 */
function validateInput() {
  const value = elements.fromAmount.value;

  if (!value) {
    elements.errorMessage.textContent = '';
    return false;
  }

  const amount = parseFloat(value);

  if (isNaN(amount) || amount <= 0) {
    elements.errorMessage.textContent = 'Please enter a valid amount greater than 0';
    return false;
  }

  elements.errorMessage.textContent = '';
  return true;
}

/**
 * Update submit button state
 */
function updateSubmitButton() {
  const hasTokens = state.fromToken && state.toToken;
  const hasValidAmount = validateInput();

  if (!hasTokens) {
    elements.submitBtn.disabled = true;
    elements.btnText.textContent = 'Select tokens to continue';
  } else if (!elements.fromAmount.value) {
    elements.submitBtn.disabled = true;
    elements.btnText.textContent = 'Enter amount';
  } else if (!hasValidAmount) {
    elements.submitBtn.disabled = true;
    elements.btnText.textContent = 'Invalid amount';
  } else {
    elements.submitBtn.disabled = false;
    elements.btnText.textContent = 'Confirm Swap';
  }
}

/**
 * Swap token positions
 */
function swapTokens() {
  if (!state.fromToken && !state.toToken) return;

  // Swap the tokens
  const temp = state.fromToken;
  state.fromToken = state.toToken;
  state.toToken = temp;

  // Update UI
  if (state.fromToken) {
    elements.fromTokenIcon.src = getTokenIconUrl(state.fromToken.currency);
    elements.fromTokenSymbol.textContent = state.fromToken.currency;
  } else {
    elements.fromTokenIcon.src = '';
    elements.fromTokenSymbol.textContent = 'Select';
  }

  if (state.toToken) {
    elements.toTokenIcon.src = getTokenIconUrl(state.toToken.currency);
    elements.toTokenSymbol.textContent = state.toToken.currency;
  } else {
    elements.toTokenIcon.src = '';
    elements.toTokenSymbol.textContent = 'Select';
  }

  calculateExchange();
  updateSubmitButton();
}

/**
 * Handle form submission (mocked)
 */
async function handleSubmit(e) {
  e.preventDefault();

  if (!validateInput() || !state.fromToken || !state.toToken) {
    return;
  }

  // Show loading state
  elements.submitBtn.disabled = true;
  elements.btnText.style.display = 'none';
  elements.loader.style.display = 'block';

  // Mock API call with timeout
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Hide loading, show success
  elements.loader.style.display = 'none';
  elements.btnText.style.display = 'block';
  elements.successMessage.style.display = 'block';

  // Log swap details
  console.log('Swap executed:', {
    from: {
      token: state.fromToken.currency,
      amount: elements.fromAmount.value,
    },
    to: {
      token: state.toToken.currency,
      amount: elements.toAmount.value,
    },
    rate: (state.fromToken.price / state.toToken.price).toFixed(6),
  });

  // Reset after 3 seconds
  setTimeout(() => {
    elements.successMessage.style.display = 'none';
    elements.fromAmount.value = '';
    elements.toAmount.value = '';
    elements.exchangeRate.textContent = '';
    updateSubmitButton();
  }, 3000);
}

/**
 * Search tokens
 */
function handleTokenSearch(e) {
  const searchTerm = e.target.value.toLowerCase().trim();

  if (!searchTerm) {
    renderTokenList(state.tokens);
    return;
  }

  const filtered = state.tokens.filter(token =>
    token.currency.toLowerCase().includes(searchTerm)
  );

  renderTokenList(filtered);
}

// Event Listeners
elements.fromTokenSelector.addEventListener('click', () => openTokenModal('from'));
elements.toTokenSelector.addEventListener('click', () => openTokenModal('to'));
elements.closeModal.addEventListener('click', closeTokenModal);
elements.swapDirectionBtn.addEventListener('click', swapTokens);
elements.fromAmount.addEventListener('input', () => {
  validateInput();
  calculateExchange();
  updateSubmitButton();
});
elements.tokenSearch.addEventListener('input', handleTokenSearch);
elements.form.addEventListener('submit', handleSubmit);

// Close modal when clicking outside
elements.modal.addEventListener('click', (e) => {
  if (e.target === elements.modal) {
    closeTokenModal();
  }
});

// Initialize app on load
initializeApp();
