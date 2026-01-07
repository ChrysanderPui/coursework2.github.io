const EXPENSES_KEY = 'smartMoneyExpenses';
const MONTHLY_BUDGET_KEY = 'smartMoneyMonthlyBudget';
const CATEGORY_BUDGETS_KEY = 'smartMoneyCategoryBudgets';
const MANAGED_CURRENCIES_KEY = 'smartMoneyManagedCurrencies';

const savedTheme = localStorage.getItem('theme') || 'light';
document.body.setAttribute('data-theme', savedTheme);

const allCurrencies = [
    { code: 'MYR', name: 'Malaysian Ringgit', flag: 'myr' },
    { code: 'EUR', name: 'Euro', flag: 'eur' },
    { code: 'USD', name: 'US Dollar', flag: 'usd' },
    { code: 'GBP', name: 'British Pound', flag: 'gbp' },
    { code: 'JPY', name: 'Japanese Yen', flag: 'jpy' },
    { code: 'AUD', name: 'Australian Dollar', flag: 'aud' },
    { code: 'CAD', name: 'Canadian Dollar', flag: 'cad' },
    { code: 'CHF', name: 'Swiss Franc', flag: 'chf' },
    { code: 'CNY', name: 'Chinese Yuan', flag: 'cny' }
];

const BASE_CURRENCY = 'MYR';

const ratesFromMYR = {
    MYR: 1.00,
    EUR: 0.210,
    USD: 0.247,
    GBP: 0.183,
    JPY: 38.66,
    AUD: 0.368,
    CAD: 0.337,
    CHF: 0.195,
    CNY: 1.72
};

function getExpenses() {
    const stored = localStorage.getItem(EXPENSES_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveExpenses(expenses) {
    localStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const categoryMap = {
    "Food": "Food & Dining",
    "Entertainment": "Entertainment",
    "Transport": "Transport",
    "Shopping": "Shopping",
    "Bills": "Utilities & Bills",
    "Other": "Others",
    "Health": "Health"
};

const categoryIcons = {
    "Food & Dining": "fa-utensils", // Icons are all from fontawesome icons
    "Entertainment": "fa-film",
    "Transport": "fa-car",
    "Shopping": "fa-shopping-bag",
    "Utilities & Bills": "fa-home",
    "Health": "fa-heartbeat",
    "Others": "fa-ellipsis-h"
};

const categoryClasses = {
    "Food & Dining": "cat-food",
    "Entertainment": "cat-entertainment",
    "Transport": "cat-transport",
    "Shopping": "cat-shopping",
    "Utilities & Bills": "cat-utilities",
    "Health": "cat-health",
    "Others": "cat-other"
};

if (document.getElementById('currency-list')) {
    const currencyList = document.getElementById('currency-list');
    const defaultSelect = document.getElementById('default-select');
    const defaultFlag = document.getElementById('default-flag');
    const defaultCode = document.getElementById('default-code');
    const defaultName = document.getElementById('default-name');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    const addBtn = document.getElementById('add-currency-btn');
    const closeBtn = document.querySelector('.modal-close');

    function getRateText(code) {
        if (code === BASE_CURRENCY) {
            return `Base currency (1 ${code} = 1.00 ${code})`;
        }
        const rate = ratesFromMYR[code] || 1;
        return `1 ${BASE_CURRENCY} ≈ ${rate.toFixed(3)} ${code} (as of Jan 3, 2026)`;
    }

    function saveManagedCurrencies() {
        const codes = Array.from(currencyList.querySelectorAll('.currency-card')).map(c => c.dataset.code);
        localStorage.setItem(MANAGED_CURRENCIES_KEY, JSON.stringify(codes));
    }

    function loadManagedCurrencies() {
        const saved = localStorage.getItem(MANAGED_CURRENCIES_KEY);
        let codes = saved ? JSON.parse(saved) : ['MYR', 'EUR', 'USD', 'GBP'];

        if (!codes.includes(BASE_CURRENCY)) {
            codes.unshift(BASE_CURRENCY);
        }

        currencyList.innerHTML = '';
        codes.forEach(code => {
            const currency = allCurrencies.find(c => c.code === code);
            if (currency) {
                const card = document.createElement('div');
                card.className = 'currency-card';
                card.dataset.code = code;
                const isBase = code === BASE_CURRENCY;
                card.innerHTML = `
                    <div class="currency-flag flag-${currency.flag}"></div>
                    <div class="currency-info">
                        <div class="currency-code">${code}</div>
                        <div class="currency-rate">${getRateText(code)}</div>
                    </div>
                    <button class="btn btn-danger" title="Remove" ${isBase ? 'disabled' : ''}>Remove</button>
                `;
                if (isBase) {
                    currencyList.prepend(card);
                } else {
                    currencyList.appendChild(card);
                }
            }
        });
    }

    function updateDefaultCurrencyOptions() {
        const codes = Array.from(currencyList.querySelectorAll('.currency-card')).map(c => c.dataset.code);
        defaultSelect.innerHTML = '';
        codes.forEach(code => {
            const cur = allCurrencies.find(c => c.code === code);
            if (cur) {
                const opt = document.createElement('option');
                opt.value = code;
                opt.textContent = `${code} - ${cur.name}`;
                defaultSelect.appendChild(opt);
            }
        });
        if (codes.includes(BASE_CURRENCY)) {
            defaultSelect.value = BASE_CURRENCY;
        }
        updateDefaultDisplay();
    }

    function updateDefaultDisplay() {
        const code = defaultSelect.value || BASE_CURRENCY;
        const cur = allCurrencies.find(c => c.code === code) || allCurrencies[0];
        defaultCode.textContent = cur.code;
        defaultName.textContent = cur.name;
        defaultFlag.className = `currency-flag flag-${cur.flag}`;
    }

    loadManagedCurrencies();
    updateDefaultCurrencyOptions();

    defaultSelect?.addEventListener('change', updateDefaultDisplay);

    currencyList.addEventListener('click', e => {
        const btn = e.target.closest('.btn-danger');
        if (btn && !btn.disabled) {
            btn.closest('.currency-card').remove();
            saveManagedCurrencies();
            updateDefaultCurrencyOptions();
        }
    });

    addBtn?.addEventListener('click', () => {
        const managed = Array.from(currencyList.querySelectorAll('.currency-card')).map(c => c.dataset.code);
        const available = allCurrencies.filter(c => !managed.includes(c.code));
        if (available.length === 0) {
            modalContent.innerHTML = '<p style="text-align:center;color:var(--gray);">No more currencies available.</p>';
        } else {
            modalContent.innerHTML = available.map(c => `
                <div class="currency-option" data-code="${c.code}">
                    <div class="currency-flag flag-${c.flag}"></div>
                    <div>
                        <div class="currency-code">${c.code}</div>
                        <div class="currency-name">${c.name}</div>
                    </div>
                </div>
            `).join('');
        }
        modalOverlay.style.display = 'flex';
    });

    closeBtn?.addEventListener('click', () => modalOverlay.style.display = 'none');
    modalOverlay?.addEventListener('click', e => {
        if (e.target === modalOverlay) closeBtn?.click();
    });

    modalContent.addEventListener('click', e => {
        const option = e.target.closest('.currency-option');
        if (!option) return;
        const code = option.dataset.code;
        const currency = allCurrencies.find(c => c.code === code);
        if (!currency) return;

        modalContent.innerHTML = `
            <div class="loading-bar">
                <div class="spinner-modal"></div>
                <p style="font-size:1.1rem;margin:0.5rem 0;">Downloading ${currency.name} (${code})</p>
                <div class="progress-bar"><div class="progress-fill" style="width:100%;"></div></div>
            </div>
        `;

        setTimeout(() => {
            const card = document.createElement('div');
            card.className = 'currency-card';
            card.dataset.code = code;
            card.innerHTML = `
                <div class="currency-flag flag-${currency.flag}"></div>
                <div class="currency-info">
                    <div class="currency-code">${code}</div>
                    <div class="currency-rate">${getRateText(code)}</div>
                </div>
                <button class="btn btn-danger" title="Remove">Remove</button>
            `;
            currencyList.appendChild(card);
            saveManagedCurrencies();
            updateDefaultCurrencyOptions();
            modalOverlay.style.display = 'none';
        }, 1500);
    });
}

if (document.getElementById('expenses-table-body')) {
    const tableBody = document.getElementById('expenses-table-body');
    const dateInput = document.getElementById('date');
    const currencySelect = document.getElementById('currency');

    if (dateInput) dateInput.valueAsDate = new Date();

    function populateCurrencySelect() {
        if (!currencySelect) return;

        const saved = localStorage.getItem(MANAGED_CURRENCIES_KEY);
        let managedCurrencies = saved ? JSON.parse(saved) : ['MYR', 'EUR', 'USD', 'GBP'];

        if (!managedCurrencies.includes(BASE_CURRENCY)) {
            managedCurrencies.unshift(BASE_CURRENCY);
        }

        currencySelect.innerHTML = '';
        managedCurrencies.forEach(code => {
            const cur = allCurrencies.find(c => c.code === code);
            if (cur) {
                const opt = document.createElement('option');
                opt.value = code;
                opt.textContent = `${code} - ${cur.name}`;
                if (code === BASE_CURRENCY) opt.selected = true;
                currencySelect.appendChild(opt);
            }
        });
    }

    populateCurrencySelect();
    window.addEventListener('storage', populateCurrencySelect);

    function renderExpenses() {
        const expenses = getExpenses();
        if (expenses.length === 0) {
            tableBody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="5">
                        <div>
                            <i class="fas fa-receipt"></i>
                            <p>No expenses recorded yet.</p>
                            <p style="font-size:0.9rem;margin-top:0.5rem;">Add your first expense above.</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        tableBody.innerHTML = expenses.map((exp, index) => `
            <tr>
                <td>${formatDate(exp.date)}</td>
                <td>${exp.description}</td>
                <td><span class="category-badge">${exp.category}</span></td>
                <td class="amount negative">-${exp.currency} ${parseFloat(exp.amount).toFixed(2)}</td>
                <td class="actions">
                    <button class="btn btn-danger btn-sm" data-index="${index}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `).join('');
    }

    document.getElementById('add-expense-btn')?.addEventListener('click', () => {
        const description = document.getElementById('description').value.trim();
        const amount = document.getElementById('amount').value;
        const currency = document.getElementById('currency').value;
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;

        if (!description || !amount || !date || amount <= 0) {
            alert('Please fill in all fields correctly.');
            return;
        }

        const newExpense = { description, amount, currency, category, date };
        const expenses = getExpenses();
        expenses.unshift(newExpense);
        saveExpenses(expenses);

        document.getElementById('description').value = '';
        document.getElementById('amount').value = '';
        renderExpenses();
    });

    tableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('.btn-danger');
        if (btn && confirm('Are you sure you want to delete this expense?')) {
            const index = btn.dataset.index;
            const expenses = getExpenses();
            expenses.splice(index, 1);
            saveExpenses(expenses);
            renderExpenses();
        }
    });

    renderExpenses();
}

if (document.getElementById('timeline')) {
    const timelineEl = document.getElementById('timeline');
    function renderTimeline() {
        let expenses = getExpenses();
        if (expenses.length === 0) {
            timelineEl.innerHTML = `
                <div class="empty-timeline">
                    <i class="fas fa-receipt"></i>
                    <p>No transactions yet.</p>
                    <p style="font-size:0.9rem;">Add expenses in the Manager page.</p>
                </div>`;
            return;
        }
        expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        const groups = {};
        expenses.forEach(exp => {
            const dateKey = exp.date;
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(exp);
        });
        let html = '';
        Object.keys(groups).sort((a, b) => new Date(b) - new Date(a)).forEach(dateKey => {
            const formatted = new Date(dateKey).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            html += `<div class="timeline-date">${formatted}</div><div class="transaction-list">`;
            groups[dateKey].forEach(exp => {
                const amountVal = parseFloat(exp.amount);
                const isIncome = amountVal > 0;
                const displayCategory = isIncome ? 'Income' : exp.category;
                const config = categoryClasses[displayCategory] ? { bg: categoryClasses[displayCategory], icon: categoryIcons[displayCategory] || 'fa-question-circle' } : { bg: 'cat-other', icon: 'fa-question-circle' };
                const amountSign = isIncome ? '+' : '-';
                const amountClass = isIncome ? 'amount-income' : 'amount-expense';
                const currencySymbol = exp.currency === 'EUR' ? '€' : exp.currency === 'GBP' ? '£' : '$';
                html += `
                    <div class="transaction-item">
                        <div class="transaction-icon ${config.bg}"><i class="fas ${config.icon}"></i></div>
                        <div class="transaction-details">
                            <div class="transaction-name">${exp.description}</div>
                            <div class="transaction-meta">
                                <span class="transaction-wallet"><i class="fas fa-wallet"></i> Default Wallet</span>
                                <span class="transaction-category"><i class="fas ${config.icon}"></i> ${displayCategory}</span>
                            </div>
                        </div>
                        <div class="transaction-amount ${amountClass}">${amountSign}${currencySymbol}${Math.abs(amountVal).toFixed(2)}</div>
                    </div>`;
            });
            html += '</div>';
        });
        timelineEl.innerHTML = html;
    }
    document.querySelector('.add-transaction-btn')?.addEventListener('click', () => {
        window.location.href = 'manager.html';
    });
    renderTimeline();
    window.addEventListener('storage', (e) => {
        if (e.key === EXPENSES_KEY) renderTimeline();
    });
    setInterval(renderTimeline, 5000);
}

if (document.getElementById('wallet-grid')) {
    const walletGrid = document.getElementById('wallet-grid');
    const modalOverlay = document.getElementById('modal-overlay');
    const addBtn = document.querySelector('.add-wallet-btn');
    const closeBtns = document.querySelectorAll('.modal-close');
    const form = document.getElementById('add-wallet-form');
    const colorOptions = document.querySelectorAll('.color-option');
    addBtn?.addEventListener('click', () => modalOverlay.style.display = 'flex');
    closeBtns.forEach(btn => btn.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
        form.reset();
        colorOptions.forEach((o, i) => o.classList.toggle('selected', i === 0));
    }));
    modalOverlay?.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeBtns[0]?.click();
    });
    colorOptions.forEach(option => {
        option.addEventListener('click', () => {
            colorOptions.forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
        });
    });
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('wallet-name').value.trim();
        const type = document.getElementById('wallet-type').value;
        const currency = document.getElementById('wallet-currency').value;
        const balance = parseFloat(document.getElementById('initial-balance').value || 0).toFixed(2);
        const selectedColor = document.querySelector('.color-option.selected');
        const gradient = selectedColor.dataset.gradient;
        if (!name) return alert('Please enter a wallet name');
        const newWallet = document.createElement('div');
        newWallet.className = 'wallet-card';
        newWallet.innerHTML = `
            <div class="wallet-header" style="background: linear-gradient(135deg, ${gradient});">
                <div class="wallet-type">${type}</div>
                <h2 class="wallet-name">${name}</h2>
                <div class="wallet-balance">${balance} <span class="wallet-currency">${currency}</span></div>
            </div>
            <div class="wallet-body">
                <div class="stats">
                    <div class="stat-item">
                        <div class="stat-label">This month income</div>
                        <div class="stat-value income">+0.00 ${currency}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">This month expenses</div>
                        <div class="stat-value expense">0.00 ${currency}</div>
                    </div>
                </div>
            </div>
        `;
        walletGrid.appendChild(newWallet);
        modalOverlay.style.display = 'none';
        form.reset();
        colorOptions.forEach((o, i) => o.classList.toggle('selected', i === 0));
    });
}

if (document.getElementById('budget-grid')) {
    const now = new Date();
    const currentMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    document.getElementById('current-month').textContent = currentMonth;

    const defaultCategoryBudgets = {
        "Food & Dining": 600,
        "Entertainment": 200,
        "Transport": 250,
        "Shopping": 800,
        "Utilities & Bills": 400,
        "Others": 300
    };

    function getMonthlyBudget() {
        return parseFloat(localStorage.getItem(MONTHLY_BUDGET_KEY) || '0');
    }

    function saveMonthlyBudget(amount) {
        localStorage.setItem(MONTHLY_BUDGET_KEY, amount.toString());
    }

    function getCategoryBudgets() {
        const saved = localStorage.getItem(CATEGORY_BUDGETS_KEY);
        if (saved) return JSON.parse(saved);
        localStorage.setItem(CATEGORY_BUDGETS_KEY, JSON.stringify(defaultCategoryBudgets));
        return defaultCategoryBudgets;
    }

    function convertToMYR(amount, fromCurrency) {
        if (fromCurrency === BASE_CURRENCY) return amount;
        const rateToMYR = 1 / (ratesFromMYR[fromCurrency] || 1);
        return amount * rateToMYR;
    }

    function calculateThisMonthSpending() {
        const expenses = getExpenses();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        let totalSpentMYR = 0;
        const spentByCategoryMYR = {};

        expenses.forEach(exp => {
            const expDate = new Date(exp.date);
            if (expDate.getMonth() === thisMonth && expDate.getFullYear() === thisYear) {
                const amount = parseFloat(exp.amount);
                const amountInMYR = convertToMYR(amount, exp.currency);
                totalSpentMYR += amountInMYR;

                const displayCat = categoryMap[exp.category] || exp.category;
                spentByCategoryMYR[displayCat] = (spentByCategoryMYR[displayCat] || 0) + amountInMYR;
            }
        });

        return { totalSpentMYR, spentByCategoryMYR };
    }

    function updateSummary() {
        const monthlyBudget = getMonthlyBudget(); 
        const { totalSpentMYR } = calculateThisMonthSpending();
        const remaining = monthlyBudget - totalSpentMYR;

        document.getElementById('total-budget').textContent = `RM ${monthlyBudget.toFixed(0)}`;
        document.getElementById('spent-this-month').textContent = `RM ${totalSpentMYR.toFixed(0)}`;

        const remainingEl = document.getElementById('remaining');
        if (remaining >= 0) {
            remainingEl.textContent = `RM ${remaining.toFixed(0)} left`;
            remainingEl.classList.replace('value-negative', 'value-positive');
        } else {
            remainingEl.textContent = `RM ${Math.abs(remaining).toFixed(0)} over`;
            remainingEl.classList.replace('value-positive', 'value-negative');
        }
    }

    function renderCategoryBudgets() {
        const categoryBudgets = getCategoryBudgets();
        const { spentByCategoryMYR } = calculateThisMonthSpending();
        const grid = document.getElementById('budget-grid');
        grid.innerHTML = '';

        const headerClasses = {
            "Food & Dining": "food",
            "Entertainment": "entertainment",
            "Transport": "transport",
            "Shopping": "shopping",
            "Utilities & Bills": "utilities",
            "Others": "others"
        };

        const icons = {
            "Food & Dining": "fa-utensils",
            "Entertainment": "fa-film",
            "Transport": "fa-car",
            "Shopping": "fa-shopping-bag",
            "Utilities & Bills": "fa-home",
            "Others": "fa-ellipsis-h"
        };

        Object.keys(categoryBudgets).forEach(cat => {
            const budgeted = categoryBudgets[cat];
            const spent = spentByCategoryMYR[cat] || 0;
            const percentage = budgeted > 0 ? (spent / budgeted) * 100 : 0;
            const remaining = budgeted - spent;
            let progressClass = percentage > 90 ? 'danger' : percentage > 70 ? 'warning' : 'safe';
            const headerClass = headerClasses[cat] || "others";
            const icon = icons[cat] || "fa-question-circle";

            const card = document.createElement('div');
            card.className = 'budget-card';
            card.innerHTML = `
                <div class="budget-header ${headerClass}">
                    <div class="budget-icon"><i class="fas ${icon}"></i></div>
                    <div class="budget-name">${cat}</div>
                    <div class="budget-period">${currentMonth}</div>
                </div>
                <div class="budget-body">
                    <div class="progress-container">
                        <div class="progress-label">
                            <span>RM ${spent.toFixed(0)} spent</span>

                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${progressClass}" style="width: ${percentage}%;"></div>
                        </div>
                    </div>
                    <div class="budget-amounts">
                        <span>${remaining >= 0 ? 'RM ' + remaining.toFixed(0) + ' left' : 'Over budget'}</span>
                        <span>${percentage.toFixed(1)}%</span>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }

    function init() {
        const savedMonthly = getMonthlyBudget();
        document.getElementById('monthly-budget-input').value = savedMonthly || '';
        updateSummary();
        renderCategoryBudgets();
    }

    document.querySelector('.save-budget-btn')?.addEventListener('click', () => {
        const value = parseFloat(document.getElementById('monthly-budget-input').value);
        if (isNaN(value) || value < 0) {
            alert('Please enter a valid budget amount.');
            return;
        }
        saveMonthlyBudget(value);
        updateSummary();
        alert(`Monthly budget saved: RM ${value}`);
    });

    document.querySelector('.add-budget-btn')?.addEventListener('click', () => {
        alert('Feature coming soon: Create custom category with icon, name, and budget amount.');
    });

    window.addEventListener('storage', (e) => {
        if (e.key === EXPENSES_KEY) {
            updateSummary();
            renderCategoryBudgets();
        }
    });

    init();
}

if (document.getElementById('category-breakdown')) {
    function getThisMonthData() {
        const expenses = getExpenses();
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        let totalSpent = 0;
        const spentByCategory = {};
        const spentByDate = {};
        const activeDates = new Set();
        expenses.forEach(exp => {
            const expDate = new Date(exp.date);
            if (expDate.getMonth() === thisMonth && expDate.getFullYear() === thisYear && exp.currency === "EUR") {
                const amount = parseFloat(exp.amount);
                totalSpent += amount;
                const displayCat = categoryMap[exp.category] || exp.category;
                spentByCategory[displayCat] = (spentByCategory[displayCat] || 0) + amount;
                const dateKey = exp.date;
                spentByDate[dateKey] = (spentByDate[dateKey] || 0) + amount;
                activeDates.add(dateKey);
            }
        });
        return {
            totalSpent,
            spentByCategory,
            spentByDate: Object.entries(spentByDate).sort((a, b) => b[0].localeCompare(a[0])),
            activeDays: activeDates.size
        };
    }
    function updateActivityPage() {
        const { totalSpent, spentByCategory, spentByDate, activeDays } = getThisMonthData();
        const dailyAverage = activeDays > 0 ? totalSpent / activeDays : 0;
        document.getElementById('total-spent').textContent = `€${totalSpent.toFixed(0)}`;
        document.getElementById('active-days').textContent = activeDays;
        document.getElementById('daily-average').textContent = `€${dailyAverage.toFixed(0)}`;
        const breakdownContainer = document.getElementById('category-breakdown');
        breakdownContainer.innerHTML = '';
        Object.keys(spentByCategory)
            .sort((a, b) => spentByCategory[b] - spentByCategory[a])
            .forEach(cat => {
                const amount = spentByCategory[cat];
                const percent = totalSpent > 0 ? (amount / totalSpent * 100) : 0;
                const item = document.createElement('div');
                item.className = 'category-item';
                item.innerHTML = `
                    <div class="category-icon ${categoryClasses[cat] || 'cat-other'}">
                        <i class="fas ${categoryIcons[cat] || 'fa-question'}"></i>
                    </div>
                    <div class="category-details">
                        <div class="category-name">${cat}</div>
                        <div class="category-amount">-€${amount.toFixed(2)}</div>
                        <div class="category-percent">${percent.toFixed(1)}% of total spending</div>
                    </div>
                `;
                breakdownContainer.appendChild(item);
            });
        const recentList = document.getElementById('recent-days');
        recentList.innerHTML = '';
        const recentDays = spentByDate.slice(0, 5);
        if (recentDays.length === 0) {
            recentList.innerHTML = '<div style="text-align:center; color:var(--gray); padding:2rem;">No transactions this month yet.</div>';
        } else {
            recentDays.forEach(([date, amount]) => {
                const formattedDate = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                const transactionCount = getExpenses().filter(e => e.date === date).length;
                const item = document.createElement('div');
                item.className = 'day-item';
                item.innerHTML = `
                    <div class="day-date">${formattedDate}</div>
                    <div class="day-spending">€${amount.toFixed(2)}</div>
                    <div class="day-transactions">${transactionCount} transaction${transactionCount !== 1 ? 's' : ''}</div>
                `;
                recentList.appendChild(item);
            });
        }
    }
    updateActivityPage();
    window.addEventListener('storage', (e) => {
        if (e.key === EXPENSES_KEY) updateActivityPage();
    });
}

// For dark mode
if (document.getElementById('appearance-btn')) {
    document.getElementById('appearance-btn').addEventListener('click', () => {
        const current = document.body.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });
    const faqModal = document.getElementById('faq-modal');
    document.getElementById('faq-btn')?.addEventListener('click', () => {
        faqModal.classList.add('active');
    });
    faqModal?.addEventListener('click', (e) => {
        if (e.target === faqModal) faqModal.classList.remove('active');
    });
    document.querySelectorAll('.faq-question').forEach(q => {
        q.addEventListener('click', () => {
            q.parentElement.classList.toggle('active');
        });
    });
}