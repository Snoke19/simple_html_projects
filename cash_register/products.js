// ===== Product Functions =====
import storage from "./storage.js";
import state from "./state.js";

const products = {
    getById: (id) => storage.PRODUCTS.find(p => p.id === Number(id)),

    addToCart: (product) => {
        state.cart.push(product);
        state.selectedProduct = product;
    },

    removeFromCart: (productId) => {
        state.cart = state.cart.filter(p => p.id !== productId);
        if (state.selectedProduct?.id === productId) {
            state.selectedProduct = state.cart[state.cart.length - 1] || null;
        }
    },

    clearCart: () => {
        state.cart = [];
        state.selectedProduct = null;
    },

    getCartTotal: () => {
        return state.cart.reduce((sum, product) => sum + product.price, 0);
    }
};

export default products;
