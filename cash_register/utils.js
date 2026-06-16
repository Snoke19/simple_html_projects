// ===== Utility Functions =====
import storage from "./storage.js";
import state from "./state.js";

const utils = {
    // Convert dollars to cents
    toCents: (amount) => Math.round(amount * 100),

    // Convert cents to dollars
    toDollars: (amount) => amount / 100,

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

    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),

    // Find denomination index
    findDenominationIndex: (name) => storage.DENOMINATIONS.findIndex(d => d.name === name)
};

export default utils;
