let price = 3.26;
let cid = [
    ['PENNY', 1.01],
    ['NICKEL', 2.05],
    ['DIME', 3.1],
    ['QUARTER', 4.25],
    ['ONE', 90],
    ['FIVE', 55],
    ['TEN', 20],
    ['TWENTY', 60],
    ['ONE HUNDRED', 100]
];

const displayChangeDue = document.getElementById('change-due');
const cash = document.getElementById('cash');
const purchaseBtn = document.getElementById('purchase-btn');
const priceScreen = document.getElementById('price-screen');
const cashDrawerDisplay = document.getElementById('cash-drawer-display');

const formatResults = (status, change) => {
    displayChangeDue.innerHTML = `<p>Status: ${status}</p>`;
    change.map(
        money => (displayChangeDue.innerHTML += `<p>${money[0]}: $${money[1]}</p>`)
    );
};

const checkCashRegister = () => {
    const customerCash = Number(cash.value);
    if (customerCash < price) {
        alert('Customer does not have enough money to purchase the item');
        cash.value = '';
        return;
    }

    if (customerCash === price) {
        displayChangeDue.innerHTML = '<p>No change due - customer paid with exact cash</p>';
        cash.value = '';
        return;
    }

    let changeDue = customerCash - price;
    const reversedCid = [...cid].reverse();
    const denominations = [100, 20, 10, 5, 1, 0.25, 0.1, 0.05, 0.01];
    let result = { status: 'OPEN', change: [] };
    const totalCID = reversedCid.reduce((sum, [, amount]) => sum + amount, 0).toFixed(2);

    if (parseFloat(totalCID) < changeDue) {
        displayChangeDue.innerHTML = '<p>Status: INSUFFICIENT_FUNDS</p>';
        return;
    }

    if (parseFloat(totalCID) === changeDue) {
        result.status = 'CLOSED';
        result.change = reversedCid.map(([currency, amount], index) => {
            const value = denominations[index];
            return [currency, amount];
        }).filter(([, amount]) => amount > 0);
        formatResults(result.status, result.change);
        updateUI(result.change);
        return;
    }

    reversedCid.forEach(([currency, amount], index) => {
        const value = denominations[index];
        if (changeDue >= value && amount > 0) {
            let changeAmount = 0;
            while (changeDue >= value && amount > 0) {
                amount -= value;
                changeDue = parseFloat((changeDue - value).toFixed(2));
                changeAmount += value;
            }
            if (changeAmount > 0) {
                result.change.push([currency, changeAmount]);
            }
        }
    });

    if (changeDue > 0) {
        displayChangeDue.innerHTML = "<p>Status: INSUFFICIENT_FUNDS</p>"
        return;
    }

    formatResults(result.status, result.change);
    updateUI(result.change);
};

const checkResults = () => {
    if (!cash.value) {
        return;
    }
    checkCashRegister();
};

const updateUI = change => {
    const currencyNameMap = {
        PENNY: 'Pennies',
        NICKEL: 'Nickels',
        DIME: 'Dimes',
        QUARTER: 'Quarters',
        ONE: 'Ones',
        FIVE: 'Fives',
        TEN: 'Tens',
        TWENTY: 'Twenties',
        'ONE HUNDRED': 'Hundreds'
    };
    if (change) {
        change.forEach(changeArr => {
            const targetArr = cid.find(cidArr => cidArr[0] === changeArr[0]);
            targetArr[1] = parseFloat((targetArr[1] - changeArr[1]).toFixed(2));
        });
    }

    cash.value = '';
    priceScreen.textContent = `Total: $${price}`;
    cashDrawerDisplay.innerHTML = `<p><strong>Change in drawer:</strong></p>
    ${cid
            .map(money => `<p>${currencyNameMap[money[0]]}: $${money[1]}</p>`)
            .join('')}  
  `;
};

purchaseBtn.addEventListener('click', checkResults);

cash.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        checkResults();
    }
});

updateUI();