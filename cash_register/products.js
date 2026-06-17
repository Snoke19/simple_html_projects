import storage from "./storage.js";
import state from "./state.js";

const findProduct = (id) => storage.PRODUCTS.find(p => p.id === Number(id));

const updateSelection = () => {
    state.selectedProduct = state.cart.at(-1) ?? null;
};

const products = {
    getById: findProduct,

    addToCart: (product) => {
        state.cart.push(product);
        state.selectedProduct = product;
    },

    removeFromCart: (productId) => {
        const initialLength = state.cart.length;
        state.cart = state.cart.filter(p => p.id !== productId);

        if (state.cart.length < initialLength) {
            updateSelection();
        }
    },

    clearCart: () => {
        state.cart = [];
        state.selectedProduct = null;
    },

    getCartTotal: () => state.cart.reduce((sum, {price}) => sum + price, 0)
};

export default products;
