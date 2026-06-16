// ===== Cash Register Application =====

// ===== Configuration =====
const CONFIG = {
    // Denominations in cents to avoid floating-point issues
    DENOMINATIONS: [
        { name: 'ONE HUNDRED', value: 10000, symbol: '$100' },
        { name: 'TWENTY', value: 2000, symbol: '$20' },
        { name: 'TEN', value: 1000, symbol: '$10' },
        { name: 'FIVE', value: 500, symbol: '$5' },
        { name: 'ONE', value: 100, symbol: '$1' },
        { name: 'QUARTER', value: 25, symbol: '25¢' },
        { name: 'DIME', value: 10, symbol: '10¢' },
        { name: 'NICKEL', value: 5, symbol: '5¢' },
        { name: 'PENNY', value: 1, symbol: '1¢' }
    ],
    
    // Default cash drawer (in cents)
    DEFAULT_CID: [
        ['PENNY', 101],
        ['NICKEL', 205],
        ['DIME', 310],
        ['QUARTER', 425],
        ['ONE', 9000],
        ['FIVE', 5500],
        ['TEN', 2000],
        ['TWENTY', 6000],
        ['ONE HUNDRED', 10000]
    ],
    
    // Products
    PRODUCTS: [
        { id: 1, name: 'Coffee', price: 326, icon: 'fa-coffee', category: 'Drinks' },
        { id: 2, name: 'Sandwich', price: 599, icon: 'fa-bread-slice', category: 'Food' },
        { id: 3, name: 'Water', price: 199, icon: 'fa-glass-water', category: 'Drinks' },
        { id: 4, name: 'Chips', price: 125, icon: 'fa-cookie', category: 'Snacks' },
        { id: 5, name: 'Soda', price: 175, icon: 'fa-glass-water', category: 'Drinks' },
        { id: 6, name: 'Burger', price: 799, icon: 'fa-hamburger', category: 'Food' },
        { id: 7, name: 'Pizza', price: 1299, icon: 'fa-pizza-slice', category: 'Food' },
        { id: 8, name: 'Ice Cream', price: 250, icon: 'fa-ice-cream', category: 'Dessert' },
        { id: 9, name: 'Salad', price: 450, icon: 'fa-leaf', category: 'Food' },
        { id: 10, name: 'Cookie', price: 75, icon: 'fa-cookie-bite', category: 'Dessert' },
        { id: 11, name: 'Juice', price: 225, icon: 'fa-glass-water', category: 'Drinks' },
        { id: 12, name: 'Cake', price: 350, icon: 'fa-birthday-cake', category: 'Dessert' }
    ]
};

// ===== State Management =====
const state = {
    cid: [...CONFIG.DEFAULT_CID],
    selectedProduct: null,
    cart: [],
    transactions: [],
    theme: 'light',
    isDrawerOpen: true,
    transactionCounter: 1
};

// ===== DOM Elements =====
let elements = {};

// ===== Utility Functions =====
const utils = {
    // Convert dollars to cents
    toCents: (amount) => Math.round(amount * 100),
    
    // Convert cents to dollars
    toDollars: (amount) => amount / 100,
    
    // Format currency
    formatCurrency: (amount) => {
        const dollars = Math.floor(amount / 100);
        const cents = amount % 100;
        return `$${dollars}.${cents.toString().padStart(2, '0')}`;
    },
    
    // Format amount for display (from dollars)
    formatDisplay: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    },
    
    // Get current timestamp
    getTimestamp: () => {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit' 
        });
    },
    
    // Generate transaction ID
    generateTransactionId: () => {
        const id = state.transactionCounter++;
        const timestamp = Date.now().toString().slice(-4);
        return `T${id}-${timestamp}`;
    },
    
    // Deep clone object
    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
    
    // Find denomination by name
    findDenomination: (name) => CONFIG.DENOMINATIONS.find(d => d.name === name),
    
    // Find denomination index
    findDenominationIndex: (name) => CONFIG.DENOMINATIONS.findIndex(d => d.name === name)
};

// ===== Cash Drawer Functions =====
const cashDrawer = {
    // Get total amount in drawer (in cents)
    getTotal: () => {
        return state.cid.reduce((sum, [, amount]) => sum + amount, 0);
    },
    
    // Get drawer data for display
    getDisplayData: () => {
        return state.cid.map(([currency, amount]) => ({
            currency,
            amount: utils.toDollars(amount),
            displayAmount: utils.formatDisplay(utils.toDollars(amount))
        }));
    },
    
    // Check if drawer can provide change
    canProvideChange: (changeDueCents) => {
        const tempCid = utils.deepClone(state.cid);
        let remainingChange = changeDueCents;
        
        // Sort by highest denomination first
        const sortedDenominations = [...CONFIG.DENOMINATIONS].sort((a, b) => b.value - a.value);
        
        for (const denom of sortedDenominations) {
            const cidIndex = utils.findDenominationIndex(denom.name);
            if (cidIndex === -1) continue;
            
            const [currency, availableAmount] = tempCid[cidIndex];
            const denomValue = denom.value;
            
            if (remainingChange <= 0) break;
            
            if (availableAmount > 0 && remainingChange >= denomValue) {
                const maxUse = Math.floor(availableAmount / denomValue);
                const needed = Math.floor(remainingChange / denomValue);
                const use = Math.min(maxUse, needed);
                
                remainingChange -= use * denomValue;
            }
        }
        
        return remainingChange === 0;
    },
    
    // Calculate change using largest denominations first
    calculateChange: (changeDueCents) => {
        const tempCid = utils.deepClone(state.cid);
        let remainingChange = changeDueCents;
        const changeBreakdown = [];
        
        // Sort by highest denomination first
        const sortedDenominations = [...CONFIG.DENOMINATIONS].sort((a, b) => b.value - a.value);
        
        for (const denom of sortedDenominations) {
            const cidIndex = utils.findDenominationIndex(denom.name);
            if (cidIndex === -1) continue;
            
            const [currency, availableAmount] = tempCid[cidIndex];
            const denomValue = denom.value;
            
            if (remainingChange <= 0) break;
            
            if (availableAmount > 0 && remainingChange >= denomValue) {
                const maxUse = Math.floor(availableAmount / denomValue);
                const needed = Math.floor(remainingChange / denomValue);
                const use = Math.min(maxUse, needed);
                
                const amountUsed = use * denomValue;
                remainingChange -= amountUsed;
                
                // Update temp CID
                tempCid[cidIndex][1] -= amountUsed;
                
                if (amountUsed > 0) {
                    changeBreakdown.push([currency, utils.toDollars(amountUsed)]);
                }
            }
        }
        
        return {
            change: changeBreakdown,
            remaining: remainingChange,
            isExact: remainingChange === 0
        };
    },
    
    // Update CID after transaction
    updateAfterTransaction: (changeBreakdown) => {
        for (const [currency, amountDollars] of changeBreakdown) {
            const amountCents = utils.toCents(amountDollars);
            const cidIndex = state.cid.findIndex(c => c[0] === currency);
            
            if (cidIndex !== -1) {
                state.cid[cidIndex][1] -= amountCents;
            }
        }
    },
    
    // Add to CID (for adding cash to drawer)
    addToDrawer: (currency, amountDollars) => {
        const amountCents = utils.toCents(amountDollars);
        const cidIndex = state.cid.findIndex(c => c[0] === currency);
        
        if (cidIndex !== -1) {
            state.cid[cidIndex][1] += amountCents;
        }
    },
    
    // Reset to default
    reset: () => {
        state.cid = utils.deepClone(CONFIG.DEFAULT_CID);
    }
};

// ===== Product Functions =====
const products = {
    getAll: () => CONFIG.PRODUCTS,
    
    getById: (id) => CONFIG.PRODUCTS.find(p => p.id === Number(id)),
    
    addToCart: (product) => {
        state.cart.push(product);
        state.selectedProduct = product;
    },
    
    removeFromCart: (productId) => {
        state.cart = state.cart.filter(p => p.id !== productId);
        if (state.selectedProduct?.id === productId) {
            state.selectedProduct = state.cart[state.cart.length - 1] || null;
        }
    },
    
    clearCart: () => {
        state.cart = [];
        state.selectedProduct = null;
    },
    
    getCartTotal: () => {
        return state.cart.reduce((sum, product) => sum + product.price, 0);
    },
    
    getCartCount: () => state.cart.length
};

// ===== Transaction Functions =====
const transactions = {
    add: (data) => {
        const transaction = {
            id: utils.generateTransactionId(),
            timestamp: utils.getTimestamp(),
            date: new Date().toLocaleDateString(),
            ...data
        };
        state.transactions.unshift(transaction);
        return transaction;
    },
    
    clear: () => {
        state.transactions = [];
        state.transactionCounter = 1;
    },
    
    getAll: () => state.transactions,
    
    getById: (id) => state.transactions.find(t => t.id === id)
};

// ===== UI Functions =====
const ui = {
    // Initialize UI
    init: () => {
        ui.renderProducts();
        ui.updateCartDisplay();
        ui.updateDrawerDisplay();
        ui.updateTransactionsDisplay();
        ui.loadTheme();
    },
    
    // Render product cards
    renderProducts: () => {
        elements.productsGrid.innerHTML = '';
        
        CONFIG.PRODUCTS.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.dataset.id = product.id;
            
            // Check if product is in cart
            const isInCart = state.cart.some(p => p.id === product.id);
            if (isInCart) {
                productCard.classList.add('selected');
            }
            
            // Get cart count for this product
            const cartCount = state.cart.filter(p => p.id === product.id).length;
            
            productCard.innerHTML = `
                <div class="product-icon">
                    <i class="fas ${product.icon}"></i>
                </div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">${utils.formatDisplay(utils.toDollars(product.price))}</div>
                ${cartCount > 0 ? `<div class="product-count">${cartCount}</div>` : ''}
            `;
            
            elements.productsGrid.appendChild(productCard);
        });
    },
    
    // Handle product click
    handleProductClick: (product) => {
        // If product is already selected, remove from cart
        const existingIndex = state.cart.findIndex(p => p.id === product.id);
        
        if (existingIndex !== -1) {
            products.removeFromCart(product.id);
        } else {
            products.addToCart(product);
        }
        
        ui.updateCartDisplay();
        ui.renderProducts();
        ui.showNotification(`${product.name} ${existingIndex !== -1 ? 'removed from' : 'added to'} cart`);
    },
    
    // Update cart display
    updateCartDisplay: () => {
        const cartTotal = utils.toDollars(products.getCartTotal());
        elements.totalAmount.textContent = utils.formatDisplay(cartTotal);
        
        // Update register display
        if (state.cart.length === 0) {
            elements.itemDisplay.textContent = 'Select a product';
            elements.priceDisplay.textContent = '$0.00';
            elements.purchaseBtn.disabled = true;
        } else if (state.cart.length === 1) {
            elements.itemDisplay.textContent = state.cart[0].name;
            elements.priceDisplay.textContent = utils.formatDisplay(utils.toDollars(state.cart[0].price));
            elements.purchaseBtn.disabled = false;
        } else {
            elements.itemDisplay.textContent = `${state.cart.length} items`;
            elements.priceDisplay.textContent = utils.formatDisplay(cartTotal);
            elements.purchaseBtn.disabled = false;
        }
        
        // Clear cash input when cart changes
        elements.cashInput.value = '';
    },
    
    // Update drawer display
    updateDrawerDisplay: () => {
        const drawerData = cashDrawer.getDisplayData();
        const drawerTotal = utils.toDollars(cashDrawer.getTotal());
        
        elements.drawerContents.innerHTML = drawerData.map(item => `
            <div class="drawer-row">
                <span class="currency-name">${item.currency}</span>
                <span class="currency-amount">${item.displayAmount}</span>
            </div>
        `).join('');
        
        elements.drawerTotal.textContent = utils.formatDisplay(drawerTotal);
    },
    
    // Update transactions display
    updateTransactionsDisplay: () => {
        const allTransactions = transactions.getAll();
        
        if (allTransactions.length === 0) {
            elements.transactionsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <p>No transactions yet</p>
                </div>
            `;
            return;
        }
        
        elements.transactionsList.innerHTML = allTransactions.slice(0, 10).map(tx => {
            const statusClass = tx.status === 'SUCCESS' ? 'success' : 'insufficient';
            return `
                <div class="transaction-item ${statusClass}">
                    <div class="transaction-header">
                        <span class="transaction-id">${tx.id}</span>
                        <span class="transaction-time">${tx.timestamp}</span>
                    </div>
                    <div class="transaction-body">
                        ${tx.status === 'SUCCESS' ? `
                            <p><strong>${tx.itemName}</strong> - ${utils.formatDisplay(tx.amount)}</p>
                            <p>Paid: ${utils.formatDisplay(tx.paid)}</p>
                            <p>Change: ${utils.formatDisplay(tx.change)}</p>
                        ` : `
                            <p class="text-danger">Insufficient funds for ${tx.itemName}</p>
                            <p>Amount: ${utils.formatDisplay(tx.amount)}</p>
                        `}
                    </div>
                </div>
            `;
        }).join('');
    },
    
    // Show notification
    showNotification: (message, isError = false) => {
        elements.notificationMessage.textContent = message;
        elements.notification.classList.toggle('error', isError);
        elements.notification.classList.add('show');
        
        setTimeout(() => {
            elements.notification.classList.remove('show');
        }, 3000);
    },
    
    // Show change modal
    showChangeModal: (result, transaction) => {
        elements.changeResults.innerHTML = `
            <div class="change-result">
                <div class="change-status">
                    <i class="fas fa-${result.status === 'SUCCESS' ? 'check-circle text-success' : 'times-circle text-danger'}"></i>
                    <h4>Status: ${result.status}</h4>
                </div>
                
                ${result.status === 'SUCCESS' ? `
                    <div class="change-breakdown">
                        <h5>Change Breakdown:</h5>
                        ${result.change.length > 0 ? result.change.map(([currency, amount]) => `
                            <div class="change-row">
                                <span>${currency}:</span>
                                <span>${utils.formatDisplay(amount)}</span>
                            </div>
                        `).join('') : '<p>No change due</p>'}
                        <div class="change-total">
                            <strong>Total Change:</strong>
                            <strong>${utils.formatDisplay(result.changeAmount)}</strong>
                        </div>
                    </div>
                ` : `
                    <div class="error-message">
                        <p>${result.message}</p>
                    </div>
                `}
            </div>
        `;
        
        // Store transaction for receipt
        state.currentTransaction = transaction;
        
        elements.changeModal.classList.add('active');
    },
    
    // Show receipt modal
    showReceiptModal: (transaction) => {
        const changeRows = transaction.changeBreakdown.map(([currency, amount]) => `
            <div class="receipt-change-line">
                <span>${currency}:</span>
                <span>${utils.formatDisplay(amount)}</span>
            </div>
        `).join('');
        
        elements.receiptPreview.innerHTML = `
            <div class="receipt-header">
                <h4>Cash Register Receipt</h4>
                <p>${transaction.date} | ${transaction.timestamp}</p>
                <p>Transaction #: ${transaction.id}</p>
            </div>
            
            <div class="receipt-items">
                <div class="receipt-item">
                    <span>${transaction.itemName}</span>
                    <span>${utils.formatDisplay(transaction.amount)}</span>
                </div>
            </div>
            
            <div class="receipt-total">
                <span>Total:</span>
                <span>${utils.formatDisplay(transaction.amount)}</span>
            </div>
            
            <div class="receipt-payment">
                <div class="receipt-payment-line">
                    <span>Paid:</span>
                    <span>${utils.formatDisplay(transaction.paid)}</span>
                </div>
                <div class="receipt-payment-line">
                    <span>Change:</span>
                    <span>${utils.formatDisplay(transaction.change)}</span>
                </div>
            </div>
            
            ${transaction.changeBreakdown.length > 0 ? `
                <div class="receipt-change">
                    <h5>Change Breakdown:</h5>
                    ${changeRows}
                </div>
            ` : ''}
            
            <div class="receipt-footer" style="text-align: center; margin-top: 20px; color: var(--text-muted); font-size: 0.75rem;">
                Thank you for your purchase!
            </div>
        `;
        
        elements.receiptModal.classList.add('active');
    },
    
    // Toggle drawer
    toggleDrawer: () => {
        state.isDrawerOpen = !state.isDrawerOpen;
        elements.drawerDisplay.style.display = state.isDrawerOpen ? 'block' : 'none';
        elements.drawerToggle.classList.toggle('open', state.isDrawerOpen);
    },
    
    // Toggle theme
    toggleTheme: () => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem('cash-register-theme', state.theme);
        
        // Update icon
        const icon = elements.themeToggle.querySelector('i');
        icon.className = state.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        
        ui.showNotification(`${state.theme === 'dark' ? 'Dark' : 'Light'} mode enabled`);
    },
    
    // Load theme from localStorage
    loadTheme: () => {
        const savedTheme = localStorage.getItem('cash-register-theme') || 'light';
        state.theme = savedTheme;
        document.documentElement.setAttribute('data-theme', state.theme);
        
        const icon = elements.themeToggle.querySelector('i');
        icon.className = state.theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    },
    
    // Clear cart
    clearCart: () => {
        products.clearCart();
        ui.updateCartDisplay();
        ui.renderProducts();
        ui.showNotification('Cart cleared');
    }
};

// ===== Business Logic =====
const businessLogic = {
    // Process purchase
    processPurchase: (cashReceivedDollars) => {
        const cartTotalCents = products.getCartTotal();
        
        // Validate input
        if (state.cart.length === 0) {
            return { 
                status: 'ERROR', 
                message: 'No items in cart' 
            };
        }
        
        if (!cashReceivedDollars || cashReceivedDollars <= 0) {
            return { 
                status: 'ERROR', 
                message: 'Please enter a valid cash amount' 
            };
        }
        
        const cashReceivedCents = utils.toCents(cashReceivedDollars);
        const totalAmountCents = cartTotalCents;
        
        // Check if customer paid enough
        if (cashReceivedCents < totalAmountCents) {
            return { 
                status: 'INSUFFICIENT_PAYMENT', 
                message: `Customer needs $${utils.formatDisplay(utils.toDollars(totalAmountCents - cashReceivedCents))} more` 
            };
        }
        
        // Check if exact payment
        if (cashReceivedCents === totalAmountCents) {
            // No change needed, but still need to check if drawer can be closed
            const totalCid = cashDrawer.getTotal();
            
            // Add payment to drawer
            cashDrawer.addToDrawer('ONE', utils.toDollars(cashReceivedCents));
            
            const transaction = {
                status: 'SUCCESS',
                itemName: state.cart.map(p => p.name).join(', '),
                amount: utils.toDollars(totalAmountCents),
                paid: cashReceivedDollars,
                change: 0,
                changeBreakdown: [],
                changeAmount: 0,
                paymentMethod: 'Cash'
            };
            
            transactions.add(transaction);
            products.clearCart();
            
            return { 
                status: 'SUCCESS',
                message: 'Exact payment - no change due',
                change: [],
                changeAmount: 0,
                transaction
            };
        }
        
        // Calculate change due
        const changeDueCents = cashReceivedCents - totalAmountCents;
        const changeDueDollars = utils.toDollars(changeDueCents);
        
        // Check if drawer has enough funds
        const totalCid = cashDrawer.getTotal();
        
        if (totalCid < changeDueCents) {
            return { 
                status: 'INSUFFICIENT_FUNDS', 
                message: 'Insufficient funds in drawer to provide change' 
            };
        }
        
        // Check if drawer can provide exact change
        if (!cashDrawer.canProvideChange(changeDueCents)) {
            return { 
                status: 'INSUFFICIENT_FUNDS', 
                message: 'Cannot provide exact change with current drawer contents' 
            };
        }
        
        // Calculate change breakdown
        const changeCalculation = cashDrawer.calculateChange(changeDueCents);
        
        if (!changeCalculation.isExact) {
            return { 
                status: 'INSUFFICIENT_FUNDS', 
                message: 'Cannot provide exact change' 
            };
        }
        
        // Add payment to drawer (cash received)
        // Distribute the payment across denominations
        let remainingPayment = cashReceivedCents;
        const sortedDenominations = [...CONFIG.DENOMINATIONS].sort((a, b) => b.value - a.value);
        
        for (const denom of sortedDenominations) {
            if (remainingPayment <= 0) break;
            
            const denomValue = denom.value;
            const count = Math.floor(remainingPayment / denomValue);
            
            if (count > 0) {
                const amount = count * denomValue;
                cashDrawer.addToDrawer(denom.name, utils.toDollars(amount));
                remainingPayment -= amount;
            }
        }
        
        // Remove change from drawer
        cashDrawer.updateAfterTransaction(changeCalculation.change);
        
        // Create transaction
        const transaction = {
            status: 'SUCCESS',
            itemName: state.cart.length === 1 ? 
                state.cart[0].name : 
                `${state.cart.length} items`,
            amount: utils.toDollars(totalAmountCents),
            paid: cashReceivedDollars,
            change: changeDueDollars,
            changeBreakdown: changeCalculation.change,
            changeAmount: changeDueDollars,
            paymentMethod: 'Cash'
        };
        
        transactions.add(transaction);
        products.clearCart();
        
        return { 
            status: 'SUCCESS',
            message: 'Transaction completed successfully',
            change: changeCalculation.change,
            changeAmount: changeDueDollars,
            transaction
        };
    }
};

// ===== Event Listeners =====
const eventListeners = {
    init: () => {
        // Product selection
        elements.productsGrid.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (!productCard) return;
            
            const productId = parseInt(productCard.dataset.id);
            const product = products.getById(productId);
            if (product) {
                ui.handleProductClick(product);
            }
        });
        
        // Cash input
        elements.cashInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                eventListeners.handlePurchase();
            }
        });
        
        // Purchase button
        elements.purchaseBtn.addEventListener('click', eventListeners.handlePurchase);
        
        // Modal close buttons
        elements.modalClose.addEventListener('click', () => {
            elements.changeModal.classList.remove('active');
        });
        elements.closeModalBtn.addEventListener('click', () => {
            elements.changeModal.classList.remove('active');
        });
        
        // Receipt modal
        elements.printReceiptBtn.addEventListener('click', () => {
            if (state.currentTransaction) {
                elements.changeModal.classList.remove('active');
                ui.showReceiptModal(state.currentTransaction);
            }
        });
        
        elements.receiptModalClose.addEventListener('click', () => {
            elements.receiptModal.classList.remove('active');
        });
        elements.closeReceiptModal.addEventListener('click', () => {
            elements.receiptModal.classList.remove('active');
        });
        
        elements.printReceiptFinal.addEventListener('click', () => {
            // Print functionality
            const transaction = state.currentTransaction;
            if (transaction) {
                // Create a printable receipt
                const printWindow = window.open('', '_blank');
                const receiptHTML = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Receipt - ${transaction.id}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
                            .receipt-header { text-align: center; margin-bottom: 20px; }
                            .receipt-item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #ccc; }
                            .receipt-total { display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 2px solid #333; }
                            .receipt-payment { margin-top: 15px; padding-top: 15px; border-top: 1px dashed #ccc; }
                            .receipt-change { margin-top: 15px; }
                            .footer { text-align: center; margin-top: 20px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <div class="receipt-header">
                            <h3>Cash Register Receipt</h3>
                            <p>${transaction.date} | ${transaction.timestamp}</p>
                            <p>Transaction #: ${transaction.id}</p>
                        </div>
                        <div class="receipt-items">
                            <div class="receipt-item">
                                <span>${transaction.itemName}</span>
                                <span>$${transaction.amount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="receipt-total">
                            <span>Total:</span>
                            <span>$${transaction.amount.toFixed(2)}</span>
                        </div>
                        <div class="receipt-payment">
                            <div class="receipt-item">
                                <span>Paid:</span>
                                <span>$${transaction.paid.toFixed(2)}</span>
                            </div>
                            <div class="receipt-item">
                                <span>Change:</span>
                                <span>$${transaction.change.toFixed(2)}</span>
                            </div>
                        </div>
                        ${transaction.changeBreakdown.length > 0 ? `
                            <div class="receipt-change">
                                <h5>Change Breakdown:</h5>
                                ${transaction.changeBreakdown.map(([currency, amount]) => `
                                    <div class="receipt-item">
                                        <span>${currency}:</span>
                                        <span>$${amount.toFixed(2)}</span>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                        <div class="footer">
                            <p>Thank you for your purchase!</p>
                        </div>
                    </body>
                    </html>
                `;
                
                if (printWindow) {
                    printWindow.document.write(receiptHTML);
                    printWindow.document.close();
                    setTimeout(() => {
                        printWindow.print();
                    }, 100);
                }
            }
        });
        
        // Drawer toggle
        elements.drawerToggle.addEventListener('click', ui.toggleDrawer);
        
        // Theme toggle
        elements.themeToggle.addEventListener('click', ui.toggleTheme);
        
        // Reset drawer
        elements.resetBtn.addEventListener('click', () => {
            cashDrawer.reset();
            ui.updateDrawerDisplay();
            ui.showNotification('Cash drawer reset to default');
        });
        
        // Clear history
        elements.clearHistoryBtn.addEventListener('click', () => {
            if (state.transactions.length > 0) {
                if (confirm('Are you sure you want to clear all transaction history?')) {
                    transactions.clear();
                    ui.updateTransactionsDisplay();
                    ui.showNotification('Transaction history cleared');
                }
            } else {
                ui.showNotification('No transactions to clear', true);
            }
        });
        
        // Close modals on outside click
        elements.changeModal.addEventListener('click', (e) => {
            if (e.target === elements.changeModal) {
                elements.changeModal.classList.remove('active');
            }
        });
        
        elements.receiptModal.addEventListener('click', (e) => {
            if (e.target === elements.receiptModal) {
                elements.receiptModal.classList.remove('active');
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape to close modals
            if (e.key === 'Escape') {
                elements.changeModal.classList.remove('active');
                elements.receiptModal.classList.remove('active');
            }
            
            // Delete to clear cart
            if (e.key === 'Delete' && state.cart.length > 0) {
                ui.clearCart();
            }
        });
    },
    
    // Handle purchase
    handlePurchase: () => {
        const cashReceived = parseFloat(elements.cashInput.value);
        
        if (isNaN(cashReceived) || cashReceived <= 0) {
            ui.showNotification('Please enter a valid cash amount', true);
            return;
        }
        
        const result = businessLogic.processPurchase(cashReceived);
        
        switch (result.status) {
            case 'SUCCESS':
                ui.updateDrawerDisplay();
                ui.updateCartDisplay();
                ui.renderProducts();
                ui.updateTransactionsDisplay();
                ui.showChangeModal(result, result.transaction);
                ui.showNotification('Transaction completed!');
                break;
                
            case 'INSUFFICIENT_PAYMENT':
            case 'INSUFFICIENT_FUNDS':
            case 'ERROR':
                ui.showChangeModal(result);
                ui.showNotification(result.message, true);
                break;
        }
        
        // Clear cash input
        elements.cashInput.value = '';
    }
};

// ===== Initialize Application =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    elements = {
        // Products
        productsGrid: document.getElementById('products-grid'),
        totalAmount: document.getElementById('total-amount'),
        
        // Register
        itemDisplay: document.getElementById('item-display'),
        priceDisplay: document.getElementById('price-display'),
        cashInput: document.getElementById('cash-input'),
        purchaseBtn: document.getElementById('purchase-btn'),
        
        // Drawer
        drawerContents: document.getElementById('drawer-contents'),
        drawerTotal: document.getElementById('drawer-total'),
        drawerToggle: document.getElementById('drawer-toggle'),
        drawerDisplay: document.getElementById('drawer-display'),
        
        // Transactions
        transactionsList: document.getElementById('transactions-list'),
        clearHistoryBtn: document.getElementById('clear-history-btn'),
        
        // Modals
        changeModal: document.getElementById('change-modal'),
        changeResults: document.getElementById('change-results'),
        modalClose: document.getElementById('modal-close'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        printReceiptBtn: document.getElementById('print-receipt-btn'),
        
        receiptModal: document.getElementById('receipt-modal'),
        receiptPreview: document.getElementById('receipt-preview'),
        receiptModalClose: document.getElementById('receipt-modal-close'),
        closeReceiptModal: document.getElementById('close-receipt-modal'),
        printReceiptFinal: document.getElementById('print-receipt-final'),
        
        // Notifications
        notification: document.getElementById('notification'),
        notificationMessage: document.getElementById('notification-message'),
        
        // Controls
        themeToggle: document.getElementById('theme-toggle'),
        resetBtn: document.getElementById('reset-btn')
    };
    
    // Verify elements are loaded
    if (!elements.productsGrid) {
        console.error('Products grid element not found!');
        return;
    }
    
    ui.init();
    eventListeners.init();
});

// Make functions available for debugging
window.cashRegister = {
    state,
    cashDrawer,
    products,
    transactions,
    ui,
    businessLogic
};
