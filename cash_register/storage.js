// ===== Configuration =====
const storage = {
    DENOMINATIONS: [
        {name: 'ONE HUNDRED', value: 10000, symbol: '$100'},
        {name: 'TWENTY', value: 2000, symbol: '$20'},
        {name: 'TEN', value: 1000, symbol: '$10'},
        {name: 'FIVE', value: 500, symbol: '$5'},
        {name: 'ONE', value: 100, symbol: '$1'},
        {name: 'QUARTER', value: 25, symbol: '25¢'},
        {name: 'DIME', value: 10, symbol: '10¢'},
        {name: 'NICKEL', value: 5, symbol: '5¢'},
        {name: 'PENNY', value: 1, symbol: '1¢'}
    ],

    // Default cash drawer (in cents)
    DEFAULT_CID: [
        ['PENNY', 101],
        ['NICKEL', 205],
        ['DIME', 310],
        ['QUARTER', 425],
        ['ONE', 9000],
        ['FIVE', 5500],
        ['TEN', 2000],
        ['TWENTY', 6000],
        ['ONE HUNDRED', 10000]
    ],

    // Products
    PRODUCTS: [
        {id: 1, name: 'Coffee', price: 326, icon: 'fa-coffee', category: 'Drinks'},
        {id: 2, name: 'Sandwich', price: 599, icon: 'fa-bread-slice', category: 'Food'},
        {id: 3, name: 'Water', price: 199, icon: 'fa-glass-water', category: 'Drinks'},
        {id: 4, name: 'Chips', price: 125, icon: 'fa-cookie', category: 'Snacks'},
        {id: 5, name: 'Soda', price: 175, icon: 'fa-glass-water', category: 'Drinks'},
        {id: 6, name: 'Burger', price: 799, icon: 'fa-hamburger', category: 'Food'},
        {id: 7, name: 'Pizza', price: 1299, icon: 'fa-pizza-slice', category: 'Food'},
        {id: 8, name: 'Ice Cream', price: 250, icon: 'fa-ice-cream', category: 'Dessert'},
        {id: 9, name: 'Salad', price: 450, icon: 'fa-leaf', category: 'Food'},
        {id: 10, name: 'Cookie', price: 75, icon: 'fa-cookie-bite', category: 'Dessert'},
        {id: 11, name: 'Juice', price: 225, icon: 'fa-glass-water', category: 'Drinks'},
        {id: 12, name: 'Cake', price: 350, icon: 'fa-birthday-cake', category: 'Dessert'}
    ]
};

export default storage;
