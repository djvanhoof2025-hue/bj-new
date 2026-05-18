export const AnalyticsModule = {
    container: null,
    currentPeriod: 'month', // 'day', 'week', 'month', 'quarter', 'year'

    init(containerId) {
        this.container = document.getElementById(containerId);
        this.renderLayout();
        this.renderAll();
        this.bindPeriodSwitcher();
    },

    // Получаем свежие данные из модулей
    getData() {
        const manualIncomes = window.IncomeModule?.state?.manualTransactions || [];
        const calendarIncomes = window.IncomeModule?.state?.calendarTransactions || [];
        const incomeTransactions = [...manualIncomes, ...calendarIncomes];
        const expenseTransactions = window.ExpenseModule?.state?.transactions || [];
        const expenseCategories = window.ExpenseModule?.state?.categories || [];
        const incomeCategories = window.IncomeModule?.state?.categories || [];

        // Только активные (неархивные)
        const activeIncomes = incomeTransactions.filter(t => !t.isArchive);
        const activeExpenses = expenseTransactions.filter(t => !t.isArchive);

        return {
            incomes: activeIncomes,
            expenses: activeExpenses,
            expenseCategories,
            incomeCategories
        };
    },

    // Фильтр данных по выбранному периоду
    filterByPeriod(transactions, period, referenceDate = new Date()) {
        return transactions.filter(t => this.isDateInPeriod(t.date, period, referenceDate));
    },

    // Расчёт сумм и агрегатов
    calculateTotals(data, period) {
        const now = new Date();
        const filteredIncomes = this.filterByPeriod(data.incomes, period, now);
        const filteredExpenses = this.filterByPeriod(data.expenses, period, now);

        const totalIncome = filteredIncomes.reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = filteredExpenses.reduce((sum, t) => sum + t.amount, 0);
        const netIncome = totalIncome - totalExpense;
        const savingsRate = totalIncome > 0 ? (netIncome / totalIncome) * 100 : 0;

        return {
            totalIncome,
            totalExpense,
            netIncome,
            savingsRate,
            filteredIncomes,
            filteredExpenses
        };
    },

    // Группировка доходов по категориям
    groupIncomesByCategory(incomes) {
        const groups = {};
        incomes.forEach(inc => {
            const cat = inc.categoryName;
            if (!groups[cat]) groups[cat] = 0;
            groups[cat] += inc.amount;
        });
        return Object.entries(groups)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount);
    },

    // Группировка расходов по категориям (с учётом лимитов)
    groupExpensesByCategory(expenses, expenseCategories) {
        const groups = {};
        expenses.forEach(exp => {
            const cat = exp.categoryName;
            if (!groups[cat]) groups[cat] = 0;
            groups[cat] += exp.amount;
        });
        return Object.entries(groups)
            .map(([name, amount]) => {
                const category = expenseCategories.find(c => c.name === name);
                const budget = category?.maxBudget || 0;
                const budgetRemaining = budget > 0 ? Math.max(0, budget - amount) : null;
                return { name, amount, budget, budgetRemaining };
            })
            .sort((a, b) => b.amount - a.amount);
    },

    // Топ операций
    getTopTransactions(transactions, limit = 5, type = 'income') {
        const sorted = [...transactions].sort((a, b) => b.amount - a.amount);
        return sorted.slice(0, limit);
    },

    // Отрисовка всего интерфейса
    renderLayout() {
        this.container.innerHTML = `
            <h2 style="font-weight: 500; margin-bottom: 25px;">📊 Подробная аналитика</h2>

            <!-- Переключатель периода -->
            <div class="analytics-period-controls" style="display: flex; gap: 10px; margin-bottom: 30px; flex-wrap: wrap;">
                <button data-period="day" class="period-btn btn ${this.currentPeriod === 'day' ? 'btn-filled' : ''}">День</button>
                <button data-period="week" class="period-btn btn ${this.currentPeriod === 'week' ? 'btn-filled' : ''}">Неделя</button>
                <button data-period="month" class="period-btn btn ${this.currentPeriod === 'month' ? 'btn-filled' : ''}">Месяц</button>
                <button data-period="quarter" class="period-btn btn ${this.currentPeriod === 'quarter' ? 'btn-filled' : ''}">Квартал</button>
                <button data-period="year" class="period-btn btn ${this.currentPeriod === 'year' ? 'btn-filled' : ''}">Год</button>
            </div>

            <!-- Сводные карточки -->
            <div class="analytics-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div class="summary-card" style="background: var(--bg-card); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color);">
                    <div style="color: var(--text-muted); font-size: 0.85rem;">Общий доход</div>
                    <div id="summary-income" style="font-size: 1.8rem; font-weight: 700; color: var(--success);">0 ₽</div>
                </div>
                <div class="summary-card" style="background: var(--bg-card); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color);">
                    <div style="color: var(--text-muted); font-size: 0.85rem;">Общий расход</div>
                    <div id="summary-expense" style="font-size: 1.8rem; font-weight: 700; color: var(--danger);">0 ₽</div>
                </div>
                <div class="summary-card" style="background: var(--bg-card); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color);">
                    <div style="color: var(--text-muted); font-size: 0.85rem;">Чистая прибыль</div>
                    <div id="summary-net" style="font-size: 1.8rem; font-weight: 700; color: var(--accent);">0 ₽</div>
                </div>
                <div class="summary-card" style="background: var(--bg-card); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color);">
                    <div style="color: var(--text-muted); font-size: 0.85rem;">Норма сбережения</div>
                    <div id="summary-savings" style="font-size: 1.8rem; font-weight: 700; color: var(--warning);">0%</div>
                </div>
            </div>

            <!-- Детализация по категориям (доходы и расходы) -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 30px;">
                <div style="background: var(--bg-card); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color);">
                    <h3 style="font-size: 1.1rem; margin-bottom: 15px;">📈 Доходы по категориям</h3>
                    <div id="income-breakdown" style="display: flex; flex-direction: column; gap: 12px;"></div>
                </div>
                <div style="background: var(--bg-card); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color);">
                    <h3 style="font-size: 1.1rem; margin-bottom: 15px;">📉 Расходы по категориям</h3>
                    <div id="expense-breakdown" style="display: flex; flex-direction: column; gap: 12px;"></div>
                </div>
            </div>

            <!-- Динамика (таблица) -->
            <div style="background: var(--bg-card); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color); margin-bottom: 30px;">
                <h3 style="font-size: 1.1rem; margin-bottom: 15px;">📅 Динамика доходов и расходов</h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;" id="dynamics-table">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <th style="text-align: left; padding: 8px;">Период</th>
                                <th style="text-align: right; padding: 8px;">Доход</th>
                                <th style="text-align: right; padding: 8px;">Расход</th>
                                <th style="text-align: right; padding: 8px;">Остаток</th>
                            </table>
                        </thead>
                        <tbody id="dynamics-body"></tbody>
                    </table>
                </div>
            </div>

            <!-- Топ-5 операций -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 25px;">
                <div style="background: var(--bg-card); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color);">
                    <h3 style="font-size: 1.1rem; margin-bottom: 15px;">🏆 Топ-5 доходов</h3>
                    <div id="top-incomes" style="display: flex; flex-direction: column; gap: 10px;"></div>
                </div>
                <div style="background: var(--bg-card); border-radius: 12px; padding: 20px; border: 1px solid var(--border-color);">
                    <h3 style="font-size: 1.1rem; margin-bottom: 15px;">🏆 Топ-5 расходов</h3>
                    <div id="top-expenses" style="display: flex; flex-direction: column; gap: 10px;"></div>
                </div>
            </div>
        `;
    },

    // Привязка переключателя периода
    bindPeriodSwitcher() {
        const btns = this.container.querySelectorAll('.period-btn');
        btns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const period = btn.dataset.period;
                if (period) {
                    this.currentPeriod = period;
                    this.renderAll();
                }
            });
        });
    },

    // Глобальная перерисовка
    renderAll() {
        const data = this.getData();
        const totals = this.calculateTotals(data, this.currentPeriod);

        // Обновляем карточки
        document.getElementById('summary-income').innerText = `${Math.round(totals.totalIncome).toLocaleString()} ₽`;
        document.getElementById('summary-expense').innerText = `${Math.round(totals.totalExpense).toLocaleString()} ₽`;
        document.getElementById('summary-net').innerText = `${Math.round(totals.netIncome).toLocaleString()} ₽`;
        document.getElementById('summary-savings').innerText = `${Math.round(totals.savingsRate)}%`;

        // Доходы по категориям
        const incomeByCat = this.groupIncomesByCategory(totals.filteredIncomes);
        const incomeContainer = document.getElementById('income-breakdown');
        incomeContainer.innerHTML = '';
        if (incomeByCat.length === 0) {
            incomeContainer.innerHTML = '<p style="color: var(--text-muted);">Нет доходов за период</p>';
        } else {
            incomeByCat.forEach(cat => {
                const percent = totals.totalIncome > 0 ? (cat.amount / totals.totalIncome) * 100 : 0;
                const item = this.createCategoryRow(cat.name, cat.amount, percent);
                incomeContainer.appendChild(item);
            });
        }

        // Расходы по категориям
        const expenseByCat = this.groupExpensesByCategory(totals.filteredExpenses, data.expenseCategories);
        const expenseContainer = document.getElementById('expense-breakdown');
        expenseContainer.innerHTML = '';
        if (expenseByCat.length === 0) {
            expenseContainer.innerHTML = '<p style="color: var(--text-muted);">Нет расходов за период</p>';
        } else {
            expenseByCat.forEach(cat => {
                const percent = totals.totalExpense > 0 ? (cat.amount / totals.totalExpense) * 100 : 0;
                let subtitle = '';
                if (cat.budgetRemaining !== null && cat.budgetRemaining >= 0) {
                    subtitle = ` / лимит: ${Math.round(cat.budget).toLocaleString()} ₽, остаток: ${Math.round(cat.budgetRemaining).toLocaleString()} ₽`;
                } else if (cat.budget > 0) {
                    subtitle = ` / лимит: ${Math.round(cat.budget).toLocaleString()} ₽`;
                }
                const item = this.createCategoryRow(cat.name, cat.amount, percent, subtitle);
                expenseContainer.appendChild(item);
            });
        }

        // Динамика (по дням или месяцам в зависимости от периода)
        this.renderDynamics(totals.filteredIncomes, totals.filteredExpenses);

        // Топ-5
        this.renderTopItems(totals.filteredIncomes, 'income');
        this.renderTopItems(totals.filteredExpenses, 'expense');
    },

    // Создание строки категории с прогресс-баром
    createCategoryRow(name, amount, percent, extraText = '') {
        const div = document.createElement('div');
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.gap = '6px';

        const topRow = document.createElement('div');
        topRow.style.display = 'flex';
        topRow.style.justifyContent = 'space-between';
        topRow.style.fontSize = '0.9rem';
        topRow.innerHTML = `<span style="font-weight: 500;">${name}</span><span>${Math.round(amount).toLocaleString()} ₽ <span style="color: var(--text-muted);">(${Math.round(percent)}%)</span>${extraText}</span>`;

        const barContainer = document.createElement('div');
        barContainer.style.width = '100%';
        barContainer.style.height = '6px';
        barContainer.style.background = 'var(--bg-main)';
        barContainer.style.borderRadius = '3px';
        barContainer.style.overflow = 'hidden';

        const bar = document.createElement('div');
        bar.style.width = `${Math.min(percent, 100)}%`;
        bar.style.height = '100%';
        bar.style.background = 'var(--accent)';
        bar.style.borderRadius = '3px';

        barContainer.appendChild(bar);
        div.appendChild(topRow);
        div.appendChild(barContainer);
        return div;
    },

    // Динамика: группируем по дням внутри выбранного периода
    renderDynamics(incomes, expenses) {
        const tbody = document.getElementById('dynamics-body');
        if (!tbody) return;

        const now = new Date();
        let dateMap = new Map(); // ключ: строка YYYY-MM-DD, значение: { income, expense }

        // Заполняем все дни периода
        let startDate, endDate;
        if (this.currentPeriod === 'day') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            endDate = new Date(startDate);
        } else if (this.currentPeriod === 'week') {
            const dayOfWeek = now.getDay();
            const start = new Date(now);
            start.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
            startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
        } else if (this.currentPeriod === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        } else if (this.currentPeriod === 'quarter') {
            const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
            startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
            endDate = new Date(now.getFullYear(), quarterStartMonth + 3, 0);
        } else { // year
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
        }

        // Инициализируем пустые дни
        let current = new Date(startDate);
        while (current <= endDate) {
            const key = current.toISOString().split('T')[0];
            dateMap.set(key, { income: 0, expense: 0, date: new Date(current) });
            current.setDate(current.getDate() + 1);
        }

        // Заполняем доходами
        incomes.forEach(inc => {
            const d = this.parseDateObj(inc.date);
            if (d && d >= startDate && d <= endDate) {
                const key = d.toISOString().split('T')[0];
                const entry = dateMap.get(key);
                if (entry) entry.income += inc.amount;
            }
        });

        // Заполняем расходами
        expenses.forEach(exp => {
            const d = this.parseDateObj(exp.date);
            if (d && d >= startDate && d <= endDate) {
                const key = d.toISOString().split('T')[0];
                const entry = dateMap.get(key);
                if (entry) entry.expense += exp.amount;
            }
        });

        // Преобразуем в массив и сортируем по дате
        const sortedEntries = Array.from(dateMap.values()).sort((a,b) => a.date - b.date);

        tbody.innerHTML = '';
        sortedEntries.forEach(entry => {
            const row = tbody.insertRow();
            const dateStr = entry.date.toLocaleDateString('ru-RU');
            row.insertCell(0).innerHTML = `<span style="padding:8px;">${dateStr}</span>`;
            row.insertCell(1).innerHTML = `<div style="text-align:right;">${Math.round(entry.income).toLocaleString()} ₽</div>`;
            row.insertCell(2).innerHTML = `<div style="text-align:right; color:var(--danger);">${Math.round(entry.expense).toLocaleString()} ₽</div>`;
            row.insertCell(3).innerHTML = `<div style="text-align:right; font-weight:500;">${Math.round(entry.income - entry.expense).toLocaleString()} ₽</div>`;
            row.style.borderBottom = '1px solid var(--border-color)';
        });
    },

    // Топ-5
    renderTopItems(transactions, type) {
        const top = this.getTopTransactions(transactions, 5, type);
        const containerId = type === 'income' ? 'top-incomes' : 'top-expenses';
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = '';
        if (top.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">Нет операций</p>';
            return;
        }

        top.forEach((t, idx) => {
            const div = document.createElement('div');
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '8px 0';
            div.style.borderBottom = '1px solid var(--border-color)';
            div.innerHTML = `
                <div style="display:flex; gap:10px; align-items:center;">
                    <span style="font-weight:600; width:28px;">${idx+1}.</span>
                    <div>
                        <div style="font-weight:500;">${t.title}</div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">${t.date} • ${t.categoryName}</div>
                    </div>
                </div>
                <span style="font-weight:700; color:${type === 'income' ? 'var(--success)' : 'var(--danger)'};">${type === 'income' ? '+' : '-'}${Math.round(t.amount).toLocaleString()} ₽</span>
            `;
            container.appendChild(div);
        });
    },

    // Вспомогательные методы
    isDateInPeriod(dateStr, period, now) {
        if (!dateStr) return false;
        let tDate = this.parseDateObj(dateStr);
        if (!tDate) return false;
        const dTarget = new Date(tDate.getFullYear(), tDate.getMonth(), tDate.getDate());
        const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (period) {
            case 'day':
                return dTarget.getTime() === dNow.getTime();
            case 'week':
                const startOfWeek = new Date(dNow);
                const day = dNow.getDay();
                startOfWeek.setDate(dNow.getDate() - (day === 0 ? 6 : day - 1));
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return dTarget >= startOfWeek && dTarget <= endOfWeek;
            case 'month':
                return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
            case 'quarter': {
                const currentQuarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
                const quarterStartDate = new Date(now.getFullYear(), currentQuarterStartMonth, 1);
                const quarterEndDate = new Date(now.getFullYear(), currentQuarterStartMonth + 3, 0);
                return dTarget >= quarterStartDate && dTarget <= quarterEndDate;
            }
            case 'year':
                return tDate.getFullYear() === now.getFullYear();
            default:
                return false;
        }
    },

    parseDateObj(dateStr) {
        if (!dateStr) return null;
        let parts;
        if (dateStr.includes('-')) {
            parts = dateStr.split('-');
            return new Date(parts[0], parts[1]-1, parts[2]);
        } else if (dateStr.includes('.')) {
            parts = dateStr.split('.');
            return new Date(parts[2], parts[1]-1, parts[0]);
        }
        return null;
    }
};