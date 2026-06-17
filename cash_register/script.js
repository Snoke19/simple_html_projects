import storage from "./storage.js";
import utils from "./utils.js";
import state from "./state.js";
import products from "./products.js";
import transactions from "./transactions.js";
import cashDrawer from "./cashDrawer.js";
import businessLogic from "./businessLogic.js";

// ===== DOM Elements =====
const elements = {};

// ===== UI Functions =====
const ui = {
    // Initialize UI
    init: () => {
        ui.renderProducts();
        ui.updateCartDisplay();
        ui.updateDrawerDisplay();
        ui.updateTransactionsDisplay();
        ui.loadTheme();
        ui.startClock();
        ui.updateSalesCounter();
    },

    // Start live clock
    startClock: () => {
        const timeEl = document.getElementById('live-time');
        const updateTime = () => {
            const now = new Date();
            timeEl.textContent = now.toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
            });
        };
        updateTime();
        setInterval(updateTime, 1000);
    },

    // Update sales counter
    updateSalesCounter: () => {
        const successCount = state.transactions.filter(t => t.status === 'SUCCESS').length;
        document.getElementById('sales-count').textContent = `${successCount} sale${successCount !== 1 ? 's' : ''} today`;
    },

    // Render product cards
    renderProducts: () => {
        elements.productsGrid.innerHTML = '';

        storage.PRODUCTS.forEach(product => {
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
        const totalItems = state.cart.length;

        // Update register display
        if (state.cart.length === 0) {
            elements.itemDisplay.textContent = 'Tap a product to start';
            elements.priceDisplay.textContent = '$0.00';
            elements.purchaseBtn.disabled = true;
            elements.screenStatus.textContent = 'READY';
            elements.screenStatus.className = 'display-status';
        } else if (state.cart.length === 1) {
            elements.itemDisplay.textContent = state.cart[0].name;
            elements.priceDisplay.textContent = utils.formatDisplay(utils.toDollars(state.cart[0].price));
            elements.purchaseBtn.disabled = false;
            elements.screenStatus.textContent = 'SCANNING';
            elements.screenStatus.className = 'display-status active';
        } else {
            elements.itemDisplay.textContent = `${state.cart.length} items`;
            elements.priceDisplay.textContent = utils.formatDisplay(cartTotal);
            elements.purchaseBtn.disabled = false;
            elements.screenStatus.textContent = 'SCANNING';
            elements.screenStatus.className = 'display-status active';
        }

        // Update meta
        document.getElementById('meta-items').textContent = totalItems;

        // Update change hint
        ui.updateChangeHint();

        // Clear cash input when cart changes
        elements.cashInput.value = '';
        document.getElementById('clear-cash').classList.remove('visible');
    },

    // Update change hint
    updateChangeHint: () => {
        const cash = parseFloat(elements.cashInput.value) || 0;
        const cartTotal = utils.toDollars(products.getCartTotal());
        const change = cash - cartTotal;
        const hint = document.getElementById('change-hint');
        const hintValue = document.getElementById('change-hint-value');

        if (change > 0 && state.cart.length > 0) {
            hint.style.display = 'flex';
            hint.classList.add('visible');
            hintValue.textContent = utils.formatDisplay(change);
        } else {
            hint.classList.remove('visible');
            if (!hint.classList.contains('visible')) {
                hint.style.display = 'none';
            }
        }
    },

    // Update drawer display
    updateDrawerDisplay: () => {
        const drawerData = cashDrawer.getDisplayData();
        const drawerTotal = utils.toDollars(cashDrawer.getTotal());

        elements.drawerContents.innerHTML = drawerData.map(item => `
            <div class="drawer-row">
                <span class="currency-name">
                    <i class="fas fa-money-bill"></i>
                    ${item.currency}
                </span>
                <span class="currency-amount">${item.displayAmount}</span>
            </div>
        `).join('');

        elements.drawerTotal.textContent = utils.formatDisplay(drawerTotal);
    },

    // Update transactions display
    updateTransactionsDisplay: () => {
        const allTransactions = transactions.getAll();
        const filter = state.transactionFilter || 'all';
        const filtered = filter === 'all'
            ? allTransactions
            : allTransactions.filter(t => t.status === (filter === 'success' ? 'SUCCESS' : 'INSUFFICIENT_FUNDS'));

        if (filtered.length === 0) {
            elements.transactionsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-ring">
                        <i class="fas fa-receipt"></i>
                    </div>
                    <p>${filter === 'all' ? 'No transactions yet' : 'No transactions found'}</p>
                    <span>${filter === 'all' ? 'Complete a sale to see history' : 'Try a different filter'}</span>
                </div>
            `;
            return;
        }

        elements.transactionsList.innerHTML = filtered.slice(0, 20).map((tx, index) => {
            const statusClass = tx.status === 'SUCCESS' ? 'success' : 'insufficient';
            const itemSummary = tx.itemsCart ? tx.itemsCart.map(item => item.name).join(', ') : (tx.itemName || 'Unknown');
            const shortSummary = itemSummary.length > 35 ? itemSummary.substring(0, 35) + '...' : itemSummary;

            return `
                <div class="transaction-item ${statusClass}" style="animation-delay: ${index * 0.05}s">
                    <div class="transaction-header">
                        <span class="transaction-id">${tx.id}</span>
                        <span class="transaction-time">${tx.timestamp}</span>
                    </div>
                    <div class="transaction-body">
                        ${tx.status === 'SUCCESS' ? `
                            <span>${shortSummary}</span><br>
                            Total: <span>${utils.formatDisplay(tx.amount)}</span> | 
                            Paid: <span>${utils.formatDisplay(tx.paid)}</span>
                            ${tx.change > 0 ? ` | Change: <span class="text-success">${utils.formatDisplay(tx.change)}</span>` : ''}
                        ` : `
                            <span class="text-danger">${tx.message || 'Insufficient funds'}</span><br>
                            Amount: <span>${utils.formatDisplay(tx.amount)}</span>
                        `}
                    </div>
                    <div class="txn-status ${statusClass}">
                        <i class="fas ${tx.status === 'SUCCESS' ? 'fa-check' : 'fa-xmark'}"></i>
                        ${tx.status === 'SUCCESS' ? 'Completed' : 'Failed'}
                    </div>
                </div>
            `;
        }).join('');
    },

    // Show notification
    showNotification: (message, isError = false) => {
        elements.notificationTitle.textContent = isError ? 'Error' : 'Success';
        elements.notificationMessage.textContent = message;
        elements.notification.className = `toast ${isError ? 'error' : 'success'} show`;

        const icon = elements.notification.querySelector('.toast-icon i');
        icon.className = isError ? 'fas fa-circle-xmark' : 'fas fa-check-circle';

        setTimeout(() => {
            elements.notification.classList.remove('show');
        }, 4000);
    },

    // Show change modal
    showChangeModal: (result, transaction) => {
        elements.changeResults.innerHTML = `
            <div class="change-results">
                <div class="change-status" style="text-align:center; margin-bottom: var(--sp-xl);">
                    <i class="fas fa-${result.status === 'SUCCESS' ? 'check-circle' : 'times-circle'}" 
                       style="font-size: 3rem; color: ${result.status === 'SUCCESS' ? 'var(--c-ok)' : 'var(--c-bad)'}; margin-bottom: var(--sp-md);"></i>
                    <h4 style="font-weight:700; color: var(--c-text); margin-bottom: var(--sp-xs);">Status: ${result.status}</h4>
                </div>

                ${result.status === 'SUCCESS' ? `
                    <div class="change-breakdown">
                        ${result.change.length > 0 ? result.change.map(([currency, amount]) => `
                            <div class="change-row-item">
                                <span class="denom">
                                    <i class="fas fa-coins"></i>
                                    ${currency}
                                </span>
                                <span class="denom-count">${utils.formatDisplay(amount)}</span>
                            </div>
                        `).join('') : '<p style="text-align:center; color: var(--c-text-3); padding: var(--sp-md);">No change due</p>'}
                        <div class="change-summary">
                            <span class="label">Total Change</span>
                            <span class="amount">${utils.formatDisplay(result.changeAmount)}</span>
                        </div>
                    </div>
                ` : `
                    <div class="error-message" style="text-align:center; padding: var(--sp-xl); color: var(--c-bad);">
                        <p style="font-weight:600;">${result.message}</p>
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
            <div class="receipt-sheet">
                <div class="receipt-head">
                    <h4>Cash Register Pro</h4>
                    <p>${transaction.date} | ${transaction.timestamp}</p>
                    <p>Transaction #: ${transaction.id}</p>
                </div>

                <div class="receipt-lines">
                    ${transaction.itemsCart ? transaction.itemsCart.map(item => `
                        <div class="receipt-line">
                            <span class="name">${item.name}</span>
                            <span class="price">${utils.formatDisplay(utils.toDollars(item.price))}</span>
                        </div>
                    `).join('') : `
                        <div class="receipt-line">
                            <span class="name">${transaction.itemName || 'Item'}</span>
                            <span class="price">${utils.formatDisplay(transaction.amount)}</span>
                        </div>
                    `}
                    <div class="receipt-grand">
                        <span>TOTAL</span>
                        <span>${utils.formatDisplay(transaction.amount)}</span>
                    </div>
                </div>

                <div class="receipt-pay">
                    <div class="receipt-pay-line">
                        <span>Paid</span>
                        <span class="val">${utils.formatDisplay(transaction.paid)}</span>
                    </div>
                    <div class="receipt-pay-line">
                        <span>Change</span>
                        <span class="val" style="color: var(--c-ok);">${utils.formatDisplay(transaction.change)}</span>
                    </div>
                </div>

                ${transaction.changeBreakdown.length > 0 ? `
                    <div class="receipt-change-section">
                        <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color: var(--c-text-3); margin-bottom: var(--sp-sm);">Change Breakdown</div>
                        ${changeRows}
                    </div>
                ` : ''}

                <div class="receipt-foot">
                    <p>Thank you for your purchase!</p>
                    <div class="receipt-barcode"></div>
                </div>
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
        state.theme = localStorage.getItem('cash-register-theme') || 'light';
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
        elements.cashInput.addEventListener('input', (e) => {
            document.getElementById('clear-cash').classList.toggle('visible', e.target.value.length > 0);
            ui.updateChangeHint();
        });

        elements.cashInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                eventListeners.handlePurchase();
            }
        });

        // Clear cash button
        document.getElementById('clear-cash').addEventListener('click', () => {
            elements.cashInput.value = '';
            document.getElementById('clear-cash').classList.remove('visible');
            ui.updateChangeHint();
            elements.cashInput.focus();
        });

        // Quick cash buttons
        document.querySelectorAll('.chip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseFloat(btn.dataset.amount);
                const current = parseFloat(elements.cashInput.value) || 0;
                elements.cashInput.value = (current + amount).toFixed(2);
                document.getElementById('clear-cash').classList.add('visible');
                ui.updateChangeHint();

                // Button animation
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => btn.style.transform = '', 150);
            });
        });

        // Purchase button
        elements.purchaseBtn.addEventListener('click', eventListeners.handlePurchase);

        // Clear cart button
        document.getElementById('clear-cart-btn').addEventListener('click', ui.clearCart);

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
                    <html lang="en">
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
                            <h3>Cash Register Pro</h3>
                            <p>${transaction.date} | ${transaction.timestamp}</p>
                            <p>Transaction #: ${transaction.id}</p>
                        </div>
                        <div class="receipt-items">
                            ${transaction.itemsCart ? transaction.itemsCart.map(item => `
                                <div class="receipt-item">
                                    <span>${item.name}</span>
                                    <span>$${utils.toDollars(item.price).toFixed(2)}</span>
                                </div>
                            `).join('') : `
                                <div class="receipt-item">
                                    <span>${transaction.itemName || 'Item'}</span>
                                    <span>$${transaction.amount.toFixed(2)}</span>
                                </div>
                            `}
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
                    ui.updateSalesCounter();
                    ui.showNotification('Transaction history cleared');
                }
            } else {
                ui.showNotification('No transactions to clear', true);
            }
        });

        // Filter pills
        document.querySelectorAll('.pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                state.transactionFilter = pill.dataset.filter;
                ui.updateTransactionsDisplay();
            });
        });

        // Product search
        document.getElementById('product-search').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = elements.productsGrid.querySelectorAll('.product-card');
            cards.forEach(card => {
                const name = card.querySelector('.product-name').textContent.toLowerCase();
                card.style.display = name.includes(term) ? '' : 'none';
            });
        });

        // Close modals on outside click
        elements.changeModal.addEventListener('click', (e) => {
            if (e.target === elements.changeModal || e.target.classList.contains('modal-shade')) {
                elements.changeModal.classList.remove('active');
            }
        });

        elements.receiptModal.addEventListener('click', (e) => {
            if (e.target === elements.receiptModal || e.target.classList.contains('modal-shade')) {
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

        // Notification close
        document.getElementById('notification-close').addEventListener('click', () => {
            elements.notification.classList.remove('show');
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
                // Clear cart and re-render products
                products.clearCart();
                ui.updateDrawerDisplay();
                ui.updateCartDisplay();
                ui.renderProducts();
                ui.updateTransactionsDisplay();
                ui.updateSalesCounter();
                ui.updateChangeHint();
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
        document.getElementById('clear-cash').classList.remove('visible');
        ui.updateChangeHint();
    }
};

// ===== Initialize Application =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize DOM elements
    elements.productsGrid = document.getElementById('products-grid');
    elements.itemDisplay = document.getElementById('item-display');
    elements.priceDisplay = document.getElementById('price-display');
    elements.screenStatus = document.getElementById('register-status');
    elements.cashInput = document.getElementById('cash-input');
    elements.purchaseBtn = document.getElementById('purchase-btn');
    elements.drawerContents = document.getElementById('drawer-contents');
    elements.drawerTotal = document.getElementById('drawer-total');
    elements.drawerToggle = document.getElementById('drawer-toggle');
    elements.drawerDisplay = document.getElementById('drawer-panel');
    elements.transactionsList = document.getElementById('transactions-list');
    elements.clearHistoryBtn = document.getElementById('clear-history-btn');
    elements.changeModal = document.getElementById('change-modal');
    elements.changeResults = document.getElementById('change-results');
    elements.modalClose = document.getElementById('modal-close');
    elements.closeModalBtn = document.getElementById('close-modal-btn');
    elements.printReceiptBtn = document.getElementById('print-receipt-btn');
    elements.receiptModal = document.getElementById('receipt-modal');
    elements.receiptPreview = document.getElementById('receipt-preview');
    elements.receiptModalClose = document.getElementById('receipt-modal-close');
    elements.closeReceiptModal = document.getElementById('close-receipt-modal');
    elements.printReceiptFinal = document.getElementById('print-receipt-final');
    elements.notification = document.getElementById('notification');
    elements.notificationTitle = document.getElementById('notification-title');
    elements.notificationMessage = document.getElementById('notification-message');
    elements.themeToggle = document.getElementById('theme-toggle');
    elements.resetBtn = document.getElementById('reset-btn');

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
