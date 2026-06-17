import storage from "./storage.js";

const state = {
    cid: [...storage.DEFAULT_CID],
    selectedProduct: null,
    cart: [],
    transactions: [],
    theme: 'light',
    isDrawerOpen: true,
    transactionCounter: 1
};

export default state;
