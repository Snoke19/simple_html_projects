import utils from "../utils.js";

export const STATUS = Object.freeze({
    ERROR: 'ERROR',
    INSUFFICIENT_PAYMENT: 'INSUFFICIENT_PAYMENT',
    INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
    SUCCESS: 'SUCCESS'
});

const frozen = (status, message) => Object.freeze({status, message});

export const noItemsInCartError = frozen(STATUS.ERROR, 'No items in cart');
export const notValidCashAmountError = frozen(STATUS.ERROR, 'Please enter a valid cash amount');
export const insufficientDrawerFunds = frozen(STATUS.INSUFFICIENT_FUNDS, 'Insufficient funds in drawer to provide change');
export const cannotProvideExactChange = frozen(STATUS.INSUFFICIENT_FUNDS, 'Cannot provide exact change with current drawer contents');
export const inexactChange = frozen(STATUS.INSUFFICIENT_FUNDS, 'Cannot provide exact change');

export const insufficientPayment = (shortfallCents) => ({
    status: STATUS.INSUFFICIENT_PAYMENT,
    message: `Customer needs ${utils.formatDisplay(utils.toDollars(shortfallCents))} more`,
});
