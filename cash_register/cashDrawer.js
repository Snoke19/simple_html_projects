import utils from "./utils.js";
import state from "./state.js";
import storage from "./storage.js";

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
        const sortedDenominations = [...storage.DENOMINATIONS].sort((a, b) => b.value - a.value);

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
        const sortedDenominations = [...storage.DENOMINATIONS].sort((a, b) => b.value - a.value);

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
        state.cid = utils.deepClone(storage.DEFAULT_CID);
    }
};

export default cashDrawer;
