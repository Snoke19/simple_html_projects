import storage from "./storage.js";
import utils from "./utils.js";
import state from "./state.js";
import products from "./products.js";
import transactions from "./transactions.js";
import cashDrawer from "./cashDrawer.js";

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
                            <strong>${tx.itemsCart.map(item => `${item.name} - ${utils.formatDisplay(utils.toDollars(item.price))}`).join('<br>')}</strong>
                            <p>Amount: ${utils.formatDisplay(tx.amount)}</p>
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
        const sortedDenominations = [...storage.DENOMINATIONS].sort((a, b) => b.value - a.value);

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
            itemsCart: state.cart,
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
                // Clear cart and re-render products
                products.clearCart();
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
    elements.productsGrid = document.getElementById('products-grid');
    elements.itemDisplay = document.getElementById('item-display');
    elements.priceDisplay = document.getElementById('price-display');
    elements.cashInput = document.getElementById('cash-input');
    elements.purchaseBtn = document.getElementById('purchase-btn');
    elements.drawerContents = document.getElementById('drawer-contents');
    elements.drawerTotal = document.getElementById('drawer-total');
    elements.drawerToggle = document.getElementById('drawer-toggle');
    elements.drawerDisplay = document.getElementById('drawer-display');
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
