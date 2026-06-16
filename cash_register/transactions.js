import state from "./state.js";
import utils from "./utils.js";

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

    getAll: () => state.transactions
};

export default transactions;
