import utils from "./utils.js";
import state from "./state.js";
import storage from "./storage.js";

const getSortedDenominations = () => [...storage.DENOMINATIONS].sort((a, b) => b.value - a.value);

const findCidEntry = (currency) => {
    const index = state.cid.findIndex(c => c[0] === currency);
    return index !== -1 ? {index, entry: state.cid[index]} : null;
}

const findDenominationIndex = (denomName) => utils.findDenominationIndex(denomName);

const calculateUse = (availableAmount, denomValue, remainingChange) => {
    const maxUse = Math.floor(availableAmount / denomValue);
    const needed = Math.floor(remainingChange / denomValue);
    return Math.min(maxUse, needed);
};

const processChange = (changeDueCents, mutatesDrawer = false) => {
    const drawer = mutatesDrawer ? state.cid : utils.deepClone(state.cid);
    let remaining = changeDueCents;
    const breakdown = [];

    for (const denom of getSortedDenominations()) {
        if (remaining <= 0) break;

        const cidIndex = findDenominationIndex(denom.name);
        if (cidIndex === -1) continue;

        const [currency, available] = drawer[cidIndex];
        const {value} = denom;

        if (available <= 0 || remaining < value) continue;

        const use = calculateUse(available, value, remaining);
        const amountUsed = use * value;
        remaining -= amountUsed;

        if (mutatesDrawer) {
            drawer[cidIndex][1] -= amountUsed;
        }

        if (amountUsed > 0) {
            breakdown.push([currency, utils.toDollars(amountUsed)]);
        }
    }

    return {breakdown, remaining};
};

const cashDrawer = {
    getTotal: () => state.cid.reduce((sum, [, amount]) => sum + amount, 0),

    getDisplayData: () =>
        state.cid.map(([currency, amount]) => {
            const dollars = utils.toDollars(amount);
            return {
                currency,
                amount: dollars,
                displayAmount: utils.formatDisplay(dollars)
            };
        }),

    canProvideChange: (changeDueCents) => processChange(changeDueCents).remaining === 0,

    calculateChange: (changeDueCents) => {
        const {breakdown, remaining} = processChange(changeDueCents);
        return {
            change: breakdown,
            remaining,
            isExact: remaining === 0
        };
    },

    updateAfterTransaction: (changeBreakdown) => {
        for (const [currency, amountDollars] of changeBreakdown) {
            const match = findCidEntry(currency);
            if (match) {
                match.entry[1] -= utils.toCents(amountDollars);
            }
        }
    },

    addToDrawer: (currency, amountDollars) => {
        const match = findCidEntry(currency);
        if (match) {
            match.entry[1] += utils.toCents(amountDollars);
        }
    },

    reset: () => {
        state.cid = utils.deepClone(storage.DEFAULT_CID);
    }
};

export default cashDrawer;
