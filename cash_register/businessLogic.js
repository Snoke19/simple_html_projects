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
    if (state.cart.length === 0) return noItemsInCartError;
    if (!cashReceivedDollars || cashReceivedDollars <= 0) return notValidCashAmountError;

    const cartTotalCents = products.getCartTotal();
    const cashReceivedCents = utils.toCents(cashReceivedDollars);

    if (cashReceivedCents < cartTotalCents) return insufficientPayment(cartTotalCents - cashReceivedCents);

    const changeDueCents = cashReceivedCents - cartTotalCents;

    if (cashDrawer.getTotal() < changeDueCents) return insufficientDrawerFunds;
    if (!cashDrawer.canProvideChange(changeDueCents)) return cannotProvideExactChange;

    const changeCalculation = cashDrawer.calculateChange(changeDueCents);
    if (!changeCalculation.isExact) return inexactChange;

    depositCashReceived(cashReceivedCents);
    cashDrawer.updateAfterTransaction(changeCalculation.change);

    const changeDueDollars = utils.toDollars(changeDueCents);

    const transaction = {
        status: STATUS.SUCCESS,
        itemsCart: [...state.cart],
        amount: utils.toDollars(cartTotalCents),
        paid: cashReceivedDollars,
        change: changeDueDollars,
        changeBreakdown: changeCalculation.change,
        changeAmount: changeDueDollars,
        paymentMethod: 'Cash'
    };

    transactions.add(transaction);
    products.clearCart();

    return {
        status: STATUS.SUCCESS,
        message: 'Transaction completed successfully',
        change: changeCalculation.change,
        changeAmount: changeDueDollars,
        transaction
    };
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
