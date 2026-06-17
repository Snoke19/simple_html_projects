import storage from "./storage.js";
import state from "./state.js";
import {currencyFormatter, timeFormatter} from "./formatters.js";

const utils = {
    toCents: (amount) => Math.round(amount * 100),

    toDollars: (amount) => amount / 100,

    formatDisplay: (amount) => currencyFormatter.format(amount),

    getTimestamp: () => timeFormatter.format(new Date()),

    generateTransactionId: () => {
        const id = state.transactionCounter++;
        const timestamp = Date.now().toString().slice(-4);
        return `T${id}-${timestamp}`;
    },

    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),

    findDenominationIndex: (name) => storage.DENOMINATIONS.findIndex(d => d.name === name)
};

export default utils;
