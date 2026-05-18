export const IncomeModule = {
    state: {
        accounts: [],
        categories: [],
        manualTransactions: [],
        calendarTransactions: [],
        activeEditId: null,
        activeEditType: null
    },

    init(containerId) {
        this.container = document.getElementById(containerId);
        this.renderLayout();
        this.initEvents();
        this.syncCalendarTransactions();
        this.renderAll();
    },

    renderLayout() {
        this.container.innerHTML = `
            <h2 style="font-weight: 500; margin-bottom: 25px;">Учет доходов и управление счетами</h2>
            
            <div class="income-layout">
                <div class="income-column">
                    <div class="income-header-block">
                        <h3>Мои Счета</h3>
                        <button class="btn" id="btn-add-account"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <div class="account-list" id="income-accounts-area"></div>
                </div>

                <div class="income-column">
                    <div class="income-header-block">
                        <h3>Категории</h3>
                        <button class="btn" id="btn-add-category"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <div class="category-list" id="income-categories-area"></div>
                </div>

                <div class="income-column" style="flex: 1.3;">
                    <div class="income-header-block">
                        <h3>История поступлений</h3>
                        <button class="btn btn-filled" id="btn-add-income"><i class="fa-solid fa-plus"></i> Добавить доход</button>
                    </div>
                    <div class="transaction-list" id="income-transactions-area"></div>
                </div>
            </div>

            <!-- Модалки (без изменений) -->
            <div class="modal-overlay" id="modal-account">
                <div class="modal">
                    <div class="modal-header"><h3 id="modal-account-title">Счет</h3></div>
                    <div class="form-group">
                        <label>Название счета</label>
                        <input type="text" id="account-name-input" placeholder="Например: Наличные, Карта ВТБ">
                    </div>
                    <div class="form-group" style="margin-top: 15px;">
                        <label id="account-balance-label">Стартовый баланс (₽)</label>
                        <input type="number" id="account-balance-input" placeholder="0" inputmode="numeric">
                    </div>
                    <div class="modal-actions">
                        <button class="btn" id="btn-close-acc-modal">Отмена</button>
                        <button class="btn btn-filled" id="btn-save-account">Сохранить</button>
                    </div>
                </div>
            </div>

            <div class="modal-overlay" id="modal-category">
                <div class="modal">
                    <div class="modal-header"><h3 id="modal-category-title">Категория</h3></div>
                    <div class="form-group">
                        <label>Название категории</label>
                        <input type="text" id="category-name-input" placeholder="Например: Фриланс">
                    </div>
                    <div class="modal-actions">
                        <button class="btn" id="btn-close-cat-modal">Отмена</button>
                        <button class="btn btn-filled" id="btn-save-category">Сохранить</button>
                    </div>
                </div>
            </div>

            <div class="modal-overlay" id="modal-income-form">
                <div class="modal">
                    <div class="modal-header"><h3 id="modal-income-title">Добавить операцию</h3></div>
                    <div class="form-group">
                        <label>Наименование / Описание</label>
                        <input type="text" id="inc-title-input" placeholder="Оплата за тираж визиток">
                    </div>
                    <div class="form-group-row" style="display: flex; gap: 10px;">
                        <div class="form-group" style="flex:1;">
                            <label>Сумма (₽)</label>
                            <input type="number" id="inc-amount-input" placeholder="0" inputmode="numeric">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Дата</label>
                            <input type="text" id="inc-date-input" placeholder="ДД.ММ.ГГГГ">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Категория</label>
                        <select id="inc-category-select"></select>
                    </div>
                    <div class="form-group">
                        <label>Зачислить на счет</label>
                        <select id="inc-account-select"></select>
                    </div>
                    <div class="modal-actions">
                        <button class="btn" id="btn-close-inc-modal">Отмена</button>
                        <button class="btn btn-filled" id="btn-save-income">Сохранить</button>
                    </div>
                </div>
            </div>
        `;
    },

    syncCalendarTransactions() {
        this.state.calendarTransactions = [];
        const calData = window.AppState.calendarData || {};
        if (this.state.accounts.length === 0) {
            this.state.accounts.push({ id: 'acc-default', name: 'Основной счет', initialBalance: 0, balance: 0 });
        }
        const defaultAccountName = this.state.accounts[0].name;

        for (const [dateKey, data] of Object.entries(calData)) {
            const parts = dateKey.split('-');
            const year = parts[0];
            const monthIdx = parseInt(parts[1]);
            const dayNum = parts[2];
            const dateStr = `${dayNum.padStart(2, '0')}.${String(monthIdx + 1).padStart(2, '0')}.${year}`;
            const baseRate = window.AppState.monthlyRates[`${year}-${monthIdx}`] || 0;
            let coefVal = parseFloat(data.coef) || 0;

            if (coefVal > 0 && !data.weekend && !data.sick) {
                let rate = (data.dailyRate && data.dailyRate > 0) ? data.dailyRate : baseRate;
                const sum = rate * coefVal;
                this.state.calendarTransactions.push({
                    id: `cal-typo-${dateKey}`, title: `Смена в типографии (Коэф. ${coefVal})`, amount: sum, date: dateStr,
                    categoryName: 'Типография (Основная)', accountName: defaultAccountName, isCalendar: true, isArchive: false
                });
            }

            if (data.dj && data.djFee > 0) {
                this.state.calendarTransactions.push({
                    id: `cal-dj-${dateKey}`, title: `Выезд DJ на мероприятие`, amount: parseFloat(data.djFee), date: dateStr,
                    categoryName: 'Event DJ', accountName: defaultAccountName, isCalendar: true, isArchive: false
                });
            }

            if (data.extras && data.extras.length > 0) {
                data.extras.forEach((extra, idx) => {
                    this.state.calendarTransactions.push({
                        id: `cal-extra-${dateKey}-${idx}`, title: extra.name || 'Доп. доход из календаря', amount: parseFloat(extra.price) || 0,
                        date: dateStr, categoryName: 'Типография (Основная)', accountName: defaultAccountName, isCalendar: true, isArchive: false
                    });
                });
            }
        }
        this.calculateBalances();
    },

    calculateBalances() {
        this.state.accounts.forEach(acc => {
            acc.balance = acc.initialBalance || 0; 
        });

        const allIncomes = [...this.state.manualTransactions, ...this.state.calendarTransactions];
        allIncomes.forEach(trans => {
            if (!trans.isArchive) {
                const account = this.state.accounts.find(a => a.name === trans.accountName);
                if (account) account.balance += trans.amount;
            }
        });

        const allExpenses = (window.AppState && window.AppState.getExpenseTransactions) ? window.AppState.getExpenseTransactions() : [];
        allExpenses.forEach(trans => {
            if (!trans.isArchive) {
                const account = this.state.accounts.find(a => a.name === trans.accountName);
                if (account) account.balance -= trans.amount;
            }
        });
    },

    renderAll() {
        this.calculateBalances();
        this.renderAccounts();
        this.renderCategories();
        this.renderTransactions();
    },

    renderAccounts() {
        const area = document.getElementById('income-accounts-area');
        if (!area) return;
        area.innerHTML = '';
        this.state.accounts.forEach(acc => {
            const item = document.createElement('div');
            item.className = 'account-item';
            item.innerHTML = `
                <div class="account-info-top">
                    <span class="account-title"><i class="fa-solid fa-credit-card" style="color: var(--accent); margin-right:6px;"></i>${acc.name}</span>
                    <div class="trans-actions" style="margin-left:auto;">
                        <button class="action-icon-btn btn-edit-acc" data-id="${acc.id}"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-icon-btn delete btn-delete-acc" data-id="${acc.id}"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
                <div class="account-balance">${Math.round(acc.balance).toLocaleString()} ₽</div>
            `;
            area.appendChild(item);
        });

        const select = document.getElementById('inc-account-select');
        if (select) {
            select.innerHTML = this.state.accounts.map(a => `<option value="${a.name}">${a.name}</option>`).join('');
        }
    },

    renderCategories() {
        const area = document.getElementById('income-categories-area');
        if (!area) return;
        area.innerHTML = '';
        this.state.categories.forEach(cat => {
            const item = document.createElement('div');
            item.className = `category-item ${cat.isArchive ? 'archived' : ''}`;
            item.innerHTML = `
                <div class="category-info">
                    <i class="fa-solid ${cat.isArchive ? 'fa-box-archive' : 'fa-folder-open'}" style="color: ${cat.isArchive ? '#9ca3af' : 'var(--accent)'}"></i>
                    <span>${cat.name} ${cat.isArchive ? '(Архив)' : ''}</span>
                </div>
                <div class="trans-actions">
                    <button class="action-icon-btn btn-edit-cat" data-id="${cat.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-icon-btn btn-archive-cat" data-id="${cat.id}"><i class="fa-solid ${cat.isArchive ? 'fa-box-open' : 'fa-box-archive'}"></i></button>
                    <button class="action-icon-btn delete btn-delete-cat" data-id="${cat.id}"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            area.appendChild(item);
        });

        const select = document.getElementById('inc-category-select');
        if (select) {
            select.innerHTML = this.state.categories.filter(c => !c.isArchive).map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        }
    },

    renderTransactions() {
        const area = document.getElementById('income-transactions-area');
        if (!area) return;
        area.innerHTML = '';
        const allTrans = [...this.state.manualTransactions, ...this.state.calendarTransactions];
        if (allTrans.length === 0) {
            area.innerHTML = `<p style="color: var(--text-muted); text-align:center; padding: 20px;">Нет зарегистрированных доходов</p>`;
            return;
        }
        allTrans.sort((a,b) => this.parseDate(b.date) - this.parseDate(a.date));
        allTrans.forEach(trans => {
            const item = document.createElement('div');
            item.className = `transaction-item ${trans.isCalendar ? 'from-calendar' : ''} ${trans.isArchive ? 'archived' : ''}`;
            
            // Действия для календарных и ручных доходов
            let actionButtons = '';
            if (trans.isCalendar) {
                actionButtons = `
                    <button class="action-icon-btn btn-edit-cal-trans" data-id="${trans.id}" title="Редактировать (создать ручную копию)"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-icon-btn btn-archive-trans" data-id="${trans.id}"><i class="fa-solid ${trans.isArchive ? 'fa-box-open' : 'fa-box-archive'}"></i></button>
                    <span class="badge-calendar">Календарь</span>
                `;
            } else {
                actionButtons = `
                    <button class="action-icon-btn btn-edit-trans" data-id="${trans.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-icon-btn btn-archive-trans" data-id="${trans.id}"><i class="fa-solid ${trans.isArchive ? 'fa-box-open' : 'fa-box-archive'}"></i></button>
                    <button class="action-icon-btn delete btn-delete-trans" data-id="${trans.id}"><i class="fa-solid fa-trash-can"></i></button>
                `;
            }
            
            item.innerHTML = `
                <div>
                    <div class="trans-title">${trans.title}</div>
                    <div class="trans-meta">${trans.date} • <span style="color: var(--accent); font-weight:500;">${trans.categoryName}</span> • <span class="badge-account">${trans.accountName}</span></div>
                </div>
                <div style="display: flex; align-items: center;">
                    <span class="trans-amount">+${Math.round(trans.amount).toLocaleString()} ₽</span>
                    <div class="trans-actions">${actionButtons}</div>
                </div>
            `;
            area.appendChild(item);
        });
    },

    initEvents() {
        document.getElementById('btn-add-account').addEventListener('click', () => this.openAccountModal());
        document.getElementById('btn-add-category').addEventListener('click', () => this.openCategoryModal());
        document.getElementById('btn-add-income').addEventListener('click', () => this.openIncomeModal());
        document.getElementById('btn-close-acc-modal').addEventListener('click', () => this.closeModal('modal-account'));
        document.getElementById('btn-close-cat-modal').addEventListener('click', () => this.closeModal('modal-category'));
        document.getElementById('btn-close-inc-modal').addEventListener('click', () => this.closeModal('modal-income-form'));
        document.getElementById('btn-save-account').addEventListener('click', () => this.saveAccount());
        document.getElementById('btn-save-category').addEventListener('click', () => this.saveCategory());
        document.getElementById('btn-save-income').addEventListener('click', () => this.saveIncome());

        this.container.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const id = target.getAttribute('data-id');
            if (target.classList.contains('btn-edit-acc')) this.openAccountModal(id);
            if (target.classList.contains('btn-delete-acc')) this.deleteAccount(id);
            if (target.classList.contains('btn-edit-cat')) this.openCategoryModal(id);
            if (target.classList.contains('btn-archive-cat')) this.toggleArchiveCategory(id);
            if (target.classList.contains('btn-delete-cat')) this.deleteCategory(id);
            if (target.classList.contains('btn-edit-trans')) this.openIncomeModal(id);
            if (target.classList.contains('btn-edit-cal-trans')) this.convertCalendarToManual(id);
            if (target.classList.contains('btn-archive-trans')) this.toggleArchiveTransaction(id);
            if (target.classList.contains('btn-delete-trans')) this.deleteTransaction(id);
        });
    },

    // НОВЫЙ МЕТОД: конвертация календарного дохода в ручной с возможностью редактирования
    convertCalendarToManual(calendarId) {
        const calendarTrans = this.state.calendarTransactions.find(t => t.id === calendarId);
        if (!calendarTrans) return;
        
        // Спрашиваем подтверждение
        if (confirm(`Создать ручную копию дохода "${calendarTrans.title}" для редактирования?\nОригинал будет заархивирован.`)) {
            // Создаём новый ручной доход
            const newManual = {
                id: 'trans-' + Date.now(),
                title: calendarTrans.title,
                amount: calendarTrans.amount,
                categoryName: calendarTrans.categoryName,
                accountName: calendarTrans.accountName,
                date: calendarTrans.date,
                isCalendar: false,
                isArchive: false
            };
            this.state.manualTransactions.push(newManual);
            
            // Архивируем календарный доход (чтобы не отображался в активных)
            calendarTrans.isArchive = true;
            
            // Перерисовываем и сохраняем
            this.renderAll();
            window.saveAppState();
            
            // Открываем форму редактирования нового ручного дохода
            this.openIncomeModal(newManual.id);
        }
    },

    openAccountModal(id = null) {
        this.state.activeEditId = id;
        const nameInput = document.getElementById('account-name-input');
        const balanceInput = document.getElementById('account-balance-input');
        const balanceLabel = document.getElementById('account-balance-label');
        if (id) {
            const acc = this.state.accounts.find(a => a.id === id);
            document.getElementById('modal-account-title').innerText = "Редактировать счет";
            balanceLabel.innerText = "Стартовый баланс (₽)";
            nameInput.value = acc.name; balanceInput.value = acc.initialBalance || 0;
        } else {
            document.getElementById('modal-account-title').innerText = "Новый счет";
            balanceLabel.innerText = "Имеющийся баланс (₽)";
            nameInput.value = ''; balanceInput.value = '';
        }
        document.getElementById('modal-account').classList.add('active');
    },

    saveAccount() {
        const name = document.getElementById('account-name-input').value.trim();
        const initialBalance = parseFloat(document.getElementById('account-balance-input').value) || 0;
        if (!name) return;
        if (this.state.activeEditId) {
            const acc = this.state.accounts.find(a => a.id === this.state.activeEditId);
            if (acc) {
                this.state.manualTransactions.forEach(t => { if (t.accountName === acc.name) t.accountName = name; });
                acc.name = name; acc.initialBalance = initialBalance;
            }
        } else {
            this.state.accounts.push({ id: 'acc-' + Date.now(), name: name, initialBalance: initialBalance, balance: initialBalance });
        }
        this.closeModal('modal-account');
        if(window.AppState && window.AppState.onExpenseUpdate) window.AppState.onExpenseUpdate(); 
        this.syncCalendarTransactions();
        this.renderAll();
        window.saveAppState();
    },

    deleteAccount(id) {
        const acc = this.state.accounts.find(a => a.id === id);
        if (!acc) return;
        if (this.state.accounts.length <= 1) { alert('Должен оставаться хотя бы один активный счет.'); return; }
        if (confirm(`Удалить счет "${acc.name}"?`)) {
            this.state.accounts = this.state.accounts.filter(a => a.id !== id);
            const fallbackAccountName = this.state.accounts[0].name;
            this.state.manualTransactions.forEach(t => { if (t.accountName === acc.name) t.accountName = fallbackAccountName; });
            this.syncCalendarTransactions();
            this.renderAll();
            window.saveAppState();
        }
    },

    openCategoryModal(id = null) {
        this.state.activeEditId = id;
        const input = document.getElementById('category-name-input');
        if (id) {
            const cat = this.state.categories.find(c => c.id === id);
            document.getElementById('modal-category-title').innerText = "Редактировать категорию";
            input.value = cat.name;
        } else {
            document.getElementById('modal-category-title').innerText = "Новая категория";
            input.value = '';
        }
        document.getElementById('modal-category').classList.add('active');
    },

    saveCategory() {
        const name = document.getElementById('category-name-input').value.trim();
        if (!name) return;
        if (this.state.activeEditId) {
            const cat = this.state.categories.find(c => c.id === this.state.activeEditId);
            if (cat) cat.name = name;
        } else {
            this.state.categories.push({ id: 'cat-' + Date.now(), name: name, isArchive: false });
        }
        this.closeModal('modal-category');
        this.renderAll();
        window.saveAppState();
    },

    toggleArchiveCategory(id) {
        const cat = this.state.categories.find(c => c.id === id);
        if (cat) cat.isArchive = !cat.isArchive;
        this.renderAll();
        window.saveAppState();
    },

    deleteCategory(id) {
        if(confirm('Удалить категорию?')) {
            this.state.categories = this.state.categories.filter(c => c.id !== id);
            this.renderAll();
            window.saveAppState();
        }
    },

    openIncomeModal(id = null) {
        this.state.activeEditId = id;
        const titleInp = document.getElementById('inc-title-input');
        const amountInp = document.getElementById('inc-amount-input');
        const catSel = document.getElementById('inc-category-select');
        const accSel = document.getElementById('inc-account-select');
        const dateInp = document.getElementById('inc-date-input');
        if (id) {
            const trans = this.state.manualTransactions.find(t => t.id === id);
            if (trans) {
                document.getElementById('modal-income-title').innerText = "Изменить операцию";
                titleInp.value = trans.title; amountInp.value = trans.amount; catSel.value = trans.categoryName; accSel.value = trans.accountName; dateInp.value = trans.date;
            } else {
                // если транзакция не найдена, открываем новую
                this.state.activeEditId = null;
                document.getElementById('modal-income-title').innerText = "Добавить доход вручную";
                titleInp.value = ''; amountInp.value = ''; dateInp.value = this.getTodayString();
            }
        } else {
            document.getElementById('modal-income-title').innerText = "Добавить доход вручную";
            titleInp.value = ''; amountInp.value = ''; dateInp.value = this.getTodayString();
        }
        document.getElementById('modal-income-form').classList.add('active');
    },

    saveIncome() {
        const title = document.getElementById('inc-title-input').value.trim() || 'Прочий доход';
        const amount = parseFloat(document.getElementById('inc-amount-input').value) || 0;
        const categoryName = document.getElementById('inc-category-select').value;
        const accountName = document.getElementById('inc-account-select').value;
        const date = document.getElementById('inc-date-input').value.trim() || this.getTodayString();
        if (amount <= 0 || !accountName) return;
        if (this.state.activeEditId) {
            const trans = this.state.manualTransactions.find(t => t.id === this.state.activeEditId);
            if (trans) { Object.assign(trans, { title, amount, categoryName, accountName, date }); }
        } else {
            this.state.manualTransactions.push({ id: 'trans-' + Date.now(), title, amount, categoryName, accountName, date, isCalendar: false, isArchive: false });
        }
        this.closeModal('modal-income-form');
        this.renderAll();
        window.saveAppState();
    },

    toggleArchiveTransaction(id) {
        // Ищем в manualTransactions
        let trans = this.state.manualTransactions.find(t => t.id === id);
        if (trans) {
            trans.isArchive = !trans.isArchive;
        } else {
            // может быть календарная
            trans = this.state.calendarTransactions.find(t => t.id === id);
            if (trans) trans.isArchive = !trans.isArchive;
        }
        this.renderAll();
        window.saveAppState();
    },

    deleteTransaction(id) {
        if(confirm('Удалить запись?')) {
            this.state.manualTransactions = this.state.manualTransactions.filter(t => t.id !== id);
            // календарные удалять нельзя, только архивировать
            this.renderAll();
            window.saveAppState();
        }
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        this.state.activeEditId = null;
    },

    getTodayString() {
        const t = new Date();
        return `${String(t.getDate()).padStart(2,'0')}.${String(t.getMonth()+1).padStart(2,'0')}.${t.getFullYear()}`;
    },

    parseDate(str) {
        const p = str.split('.');
        return new Date(p[2], p[1] - 1, p[0]);
    }
};