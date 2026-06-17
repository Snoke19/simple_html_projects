import cashDrawer from "./cashDrawer.js";
import utils from "./utils.js";
import state from "./state.js";
import storage from "./storage.js";
import transactions from "./transactions.js";
import products from "./products.js";

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
                message: `Customer needs ${utils.formatDisplay(utils.toDollars(totalAmountCents - cashReceivedCents))} more`
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
            itemsCart: [...state.cart],
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

export default businessLogic;
