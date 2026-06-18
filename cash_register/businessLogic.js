import cashDrawer from "./cashDrawer.js";
import utils from "./utils.js";
import state from "./state.js";
import storage from "./storage.js";
import transactions from "./transactions.js";
import products from "./products.js";
import {
    cannotProvideExactChange,
    inexactChange,
    insufficientDrawerFunds,
    insufficientPayment,
    noItemsInCartError,
    notValidCashAmountError,
    STATUS,
} from "./errors/messages.js";

function processPurchase(cashReceivedDollars) {
    let transaction;

    if (state.cart.length === 0) {
        const error = noItemsInCartError;
        addTransaction(error.status, cashReceivedDollars);
        return error;
    }
    if (!cashReceivedDollars || cashReceivedDollars <= 0) {
        const error = notValidCashAmountError;
        addTransaction(error.status, cashReceivedDollars);
        return error;
    }

    const cartTotalCents = products.getCartTotal();
    const cashReceivedCents = utils.toCents(cashReceivedDollars);

    if (cashReceivedCents < cartTotalCents) {
        const error = insufficientPayment(cartTotalCents - cashReceivedCents);
        addTransaction(error.status, cartTotalCents, cashReceivedDollars);
        return error;
    }

    const changeDueCents = cashReceivedCents - cartTotalCents;

    if (cashDrawer.getTotal() < changeDueCents) {
        const error = insufficientDrawerFunds;
        addTransaction(error.status, cartTotalCents, cashReceivedDollars);
        return error;
    }
    if (!cashDrawer.canProvideChange(changeDueCents)) {
        const error = cannotProvideExactChange;
        addTransaction(error.status, cartTotalCents, cashReceivedDollars);
        return error;
    }

    const changeCalculation = cashDrawer.calculateChange(changeDueCents);
    if (!changeCalculation.isExact) {
        const error = inexactChange;
        addTransaction(error.status, cartTotalCents, cashReceivedDollars, changeCalculation);
        return error;
    }

    depositCashReceived(cashReceivedCents);
    cashDrawer.updateAfterTransaction(changeCalculation.change);

    const changeDueDollars = utils.toDollars(changeDueCents);

    transaction = addTransaction(STATUS.SUCCESS, cartTotalCents, cashReceivedDollars, changeDueDollars, changeCalculation);

    products.clearCart();

    return {
        status: STATUS.SUCCESS,
        message: 'Transaction completed successfully',
        change: changeCalculation.change,
        changeAmount: changeDueDollars,
        transaction
    };
}

const addTransaction = (status, cartTotalCents, cashReceivedDollars, changeDueDollars, changeCalculation) => {
    const transaction = {
        status: status,
        itemsCart: [...state.cart],
        amount: utils.toDollars(cartTotalCents),
        paid: cashReceivedDollars,
        change: changeDueDollars,
        changeBreakdown: changeCalculation?.change,
        changeAmount: changeDueDollars,
        paymentMethod: 'Cash'
    };

    transactions.add(transaction);

    return transaction;
}

const depositCashReceived = (cashReceivedCents) => {
    let remainingPayment = cashReceivedCents;
    const sortedDenominations = [...storage.DENOMINATIONS].sort((a, b) => b.value - a.value);

    for (const denom of sortedDenominations) {
        if (remainingPayment <= 0) break;

        const count = Math.floor(remainingPayment / denom.value);
        if (count > 0) {
            const amount = count * denom.value;
            cashDrawer.addToDrawer(denom.name, utils.toDollars(amount));
            remainingPayment -= amount;
        }
    }
};

export default processPurchase;
