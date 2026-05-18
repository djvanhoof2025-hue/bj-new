export const ExpenseModule = {
    state: {
        categories: [],
        debts: [],
        transactions: [],
        activeEditId: null,
        activeParentDebtId: null 
    },

    init(containerId) {
        this.container = document.getElementById(containerId);
        this.renderLayout();
        this.initEvents();
        this.renderAll();
    },

    renderLayout() {
        this.container.innerHTML = `
            <h2 style="font-weight: 500; margin-bottom: 25px;">Учет расходов, кредитов и бюджетов</h2>
            
            <div class="income-layout" style="align-items: flex-start;">
                <div class="income-column" style="flex: 1.1;">
                    <div class="income-header-block">
                        <h3>Кредиты и Долги</h3>
                        <button class="btn" id="btn-add-debt"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <div class="account-list" id="expense-debts-area" style="display: flex; flex-direction: column; gap: 20px;"></div>
                </div>

                <div class="income-column" style="flex: 1.1;">
                    <div class="income-header-block">
                        <h3>Месячные бюджеты</h3>
                        <button class="btn" id="btn-add-exp-cat"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <div class="category-list" id="expense-categories-area" style="display: flex; flex-direction: column; gap: 12px;"></div>
                </div>

                <div class="income-column" style="flex: 1.1;">
                    <div class="income-header-block">
                        <h3>История расходов</h3>
                        <button class="btn btn-filled btn-danger" id="btn-add-expense"><i class="fa-solid fa-minus"></i> Внести расход</button>
                    </div>
                    <div class="transaction-list" id="expense-transactions-area"></div>
                </div>
            </div>

            <div class="modal-overlay" id="modal-debt">
                <div class="modal">
                    <div class="modal-header"><h3 id="modal-debt-title">Обязательство</h3></div>
                    <div class="form-group">
                        <label>Название долга / кредита</label>
                        <input type="text" id="debt-name-input" placeholder="Например: Автокредит, Долг Роману">
                    </div>
                    <div class="form-group-row" style="display: flex; gap: 10px; margin-top: 15px;">
                        <div class="form-group" style="flex:1;">
                            <label>Взято изначально (₽)</label>
                            <input type="number" id="debt-total-input" placeholder="0" inputmode="numeric">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Осталось выплатить (₽)</label>
                            <input type="number" id="debt-remaining-input" placeholder="0" inputmode="numeric">
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn" id="btn-close-debt-modal">Отмена</button>
                        <button class="btn btn-filled" id="btn-save-debt">Сохранить</button>
                    </div>
                </div>
            </div>

            <div class="modal-overlay" id="modal-schedule-payment">
                <div class="modal">
                    <div class="modal-header"><h3 id="modal-payment-title">Платеж в график</h3></div>
                    <div class="form-group">
                        <label>Дата платежа</label>
                        <input type="date" id="sheet-payment-date">
                    </div>
                    <div class="form-group" style="margin-top: 15px;">
                        <label>Сумма платежа (₽)</label>
                        <input type="number" id="sheet-payment-amount" placeholder="0" inputmode="numeric">
                    </div>
                    <div class="modal-actions">
                        <button class="btn" id="btn-close-sheet-modal">Отмена</button>
                        <button class="btn btn-filled" id="btn-save-sheet-payment">Сохранить</button>
                    </div>
                </div>
            </div>

            <div class="modal-overlay" id="modal-confirm-pay">
                <div class="modal" style="max-width: 350px;">
                    <div class="modal-header"><h3>Подтверждение платежа</h3></div>
                    <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom: 15px;" id="confirm-pay-text"></p>
                    <div class="form-group">
                        <label>Списать со счета</label>
                        <select id="confirm-pay-account-select"></select>
                    </div>
                    <div class="modal-actions" style="margin-top:20px;">
                        <button class="btn" id="btn-close-confirm-modal">Отмена</button>
                        <button class="btn btn-filled" id="btn-execute-pay-action" style="background-color:var(--success); border-color:var(--success);">Провести платеж</button>
                    </div>
                </div>
            </div>

            <div class="modal-overlay" id="modal-exp-category">
                <div class="modal">
                    <div class="modal-header"><h3 id="modal-exp-cat-title">Категория расходов</h3></div>
                    <div class="form-group">
                        <label>Название категории</label>
                        <input type="text" id="exp-cat-name-input" placeholder="Например: Транспорт, Налоги">
                    </div>
                    <div class="form-group" style="margin-top: 15px;">
                        <label>Месячный лимит бюджета (₽) <span style="color:var(--text-muted); font-size:0.8rem;">(0 или пусто — без лимита)</span></label>
                        <input type="number" id="exp-cat-budget-input" placeholder="Например: 15000" inputmode="numeric">
                    </div>
                    <div class="modal-actions">
                        <button class="btn" id="btn-close-exp-cat-modal">Отмена</button>
                        <button class="btn btn-filled" id="btn-save-exp-category">Сохранить</button>
                    </div>
                </div>
            </div>

            <div class="modal-overlay" id="modal-expense-form">
                <div class="modal">
                    <div class="modal-header"><h3 id="modal-expense-title">Внести операцию расхода</h3></div>
                    <div class="form-group">
                        <label>Наименование / Описание</label>
                        <input type="text" id="exp-title-input" placeholder="Покупка расходных материалов">
                    </div>
                    <div class="form-group-row" style="display: flex; gap: 10px;">
                        <div class="form-group" style="flex:1;">
                            <label>Сумма (₽)</label>
                            <input type="number" id="exp-amount-input" placeholder="0" inputmode="numeric">
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Дата</label>
                            <input type="text" id="exp-date-input" placeholder="ДД.ММ.ГГГГ">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Тип / Категория</label>
                        <select id="exp-category-select"></select>
                    </div>
                    <div class="form-group">
                        <label>Списать со счета</label>
                        <select id="exp-account-select"></select>
                    </div>
                    <div class="modal-actions">
                        <button class="btn" id="btn-close-exp-modal">Отмена</button>
                        <button class="btn btn-filled btn-danger" id="btn-save-expense">Зафиксировать расход</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderAll() {
        this.renderDebts();
        this.renderCategories();
        this.renderTransactions();
    },

    renderDebts() {
        const area = document.getElementById('expense-debts-area');
        if (!area) return;
        area.innerHTML = '';

        this.state.debts.forEach(debt => {
            const progress = debt.totalAmount > 0 ? Math.min(100, ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100) : 100;
            const isFullyPaid = debt.remainingAmount <= 0;

            let scheduleRows = '';
            if (!debt.payments || debt.payments.length === 0) {
                scheduleRows = `<tr><td colspan="3" style="text-align:center; color:var(--text-muted); font-size:0.8rem; padding:10px 0;">График платежей пуст</td></tr>`;
            } else {
                debt.payments.forEach(p => {
                    scheduleRows += `
                        <tr style="${p.isPaid ? 'opacity: 0.5; background: rgba(0,0,0,0.02);' : ''}">
                            <td style="font-size:0.85rem; padding: 6px 4px;"><b>${this.convertInputDateToHuman(p.date)}</b></td>
                            <td style="font-size:0.85rem; padding: 6px 4px;">${Math.round(p.amount).toLocaleString()} ₽</td>
                            <td style="text-align: right; padding: 6px 4px;">
                                ${!p.isPaid && !isFullyPaid ? `
                                    <button class="action-icon-btn btn-pay-now" data-debt-id="${debt.id}" data-pay-id="${p.id}" title="Внести этот платеж" style="color:var(--success); border-color:var(--success);"><i class="fa-solid fa-check"></i></button>
                                ` : p.isPaid ? '<span style="color:var(--success); font-size:0.75rem; font-weight:600; margin-right:5px;">Учтено</span>' : ''}
                                <button class="action-icon-btn btn-edit-pay" data-debt-id="${debt.id}" data-pay-id="${p.id}"><i class="fa-solid fa-pen" style="font-size: 0.7rem;"></i></button>
                                <button class="action-icon-btn delete btn-delete-pay" data-debt-id="${debt.id}" data-pay-id="${p.id}"><i class="fa-solid fa-trash-can" style="font-size: 0.7rem;"></i></button>
                             </td>
                         </tr>
                    `;
                });
            }

            const card = document.createElement('div');
            card.className = 'account-item';
            card.style.background = 'linear-gradient(135deg, #fff5f5 0%, #f9ebeb 100%)';
            card.style.flexDirection = 'column';
            card.style.alignItems = 'stretch';
            card.style.gap = '10px';
            card.style.padding = '18px';

            card.innerHTML = `
                <div class="account-info-top" style="display:flex; align-items:center; width:100%;">
                    <span class="account-title" style="color: #991b1b; font-weight:600;"><i class="fa-solid fa-hand-holding-dollar" style="margin-right:6px;"></i>${debt.name}</span>
                    <div class="trans-actions" style="margin-left:auto; display:flex; gap:5px;">
                        ${!isFullyPaid ? `<button class="action-icon-btn btn-add-pay-to-schedule" data-debt-id="${debt.id}" title="Добавить платеж в график" style="color:var(--accent); border-color:var(--accent);"><i class="fa-solid fa-calendar-plus"></i></button>` : ''}
                        <button class="action-icon-btn btn-edit-debt" data-id="${debt.id}"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-icon-btn delete btn-delete-debt" data-id="${debt.id}"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
                
                <div class="account-balance" style="color: var(--danger); font-size: 1.15rem; margin: 2px 0 0 0; font-weight:700;">
                    ${isFullyPaid ? '<span style="color:var(--success)">Оплачено 🎉</span>' : `Остаток: ${Math.round(debt.remainingAmount).toLocaleString()} ₽`}
                    <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal; display: block; margin-top:2px;">Базовый долг: ${Math.round(debt.totalAmount).toLocaleString()} ₽</span>
                </div>

                <div style="background: #e5e7eb; height: 5px; border-radius: 3px; overflow: hidden; margin: 4px 0;">
                    <div style="background: ${isFullyPaid ? 'var(--success)' : 'var(--danger)'}; width: ${progress}%; height: 100%;"></div>
                </div>

                <div style="margin-top: 8px; background: rgba(255,255,255,0.6); padding: 10px; border-radius: 6px; border: 1px solid rgba(0,0,0,0.05);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #e5e7eb; text-align: left;">
                                <th style="font-size: 0.7rem; color: var(--text-muted); padding-bottom:4px;">Дата</th>
                                <th style="font-size: 0.7rem; color: var(--text-muted); padding-bottom:4px;">Сумма</th>
                                <th style="font-size: 0.7rem; color: var(--text-muted); padding-bottom:4px; text-align:right;">Действия</th>
                             </tr>
                        </thead>
                        <tbody>
                            ${scheduleRows}
                        </tbody>
                     </table>
                </div>
            `;
            area.appendChild(card);
        });
    },

    renderCategories() {
        const area = document.getElementById('expense-categories-area');
        if (!area) return;
        area.innerHTML = '';

        const currentPeriod = this.getCurrentMonthYearString();

        this.state.categories.forEach(cat => {
            const spentThisMonth = this.state.transactions
                .filter(t => !t.isArchive && t.categoryName === cat.name && t.date.endsWith(currentPeriod))
                .reduce((sum, t) => sum + t.amount, 0);

            const hasBudget = cat.maxBudget && cat.maxBudget > 0;
            const budgetProgress = hasBudget ? Math.min(100, (spentThisMonth / cat.maxBudget) * 100) : 0;
            const isOverBudget = hasBudget && spentThisMonth > cat.maxBudget;

            let progressColor = 'var(--accent)';
            if (budgetProgress > 85) progressColor = '#f59e0b';
            if (isOverBudget) progressColor = 'var(--danger)';

            const item = document.createElement('div');
            item.className = `category-item ${cat.isArchive ? 'archived' : ''}`;
            item.style.flexDirection = 'column';
            item.style.alignItems = 'stretch';
            item.style.padding = '14px';
            item.style.background = isOverBudget ? 'rgba(239, 68, 68, 0.04)' : '#ffffff';
            item.style.border = isOverBudget ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(0,0,0,0.06)';

            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <div class="category-info">
                        <i class="fa-solid ${cat.isArchive ? 'fa-box-archive' : 'fa-tags'}" style="color: ${isOverBudget ? 'var(--danger)' : 'var(--accent)'}"></i>
                        <span style="font-weight: 500;">${cat.name} ${cat.isArchive ? '(Архив)' : ''}</span>
                    </div>
                    <div class="trans-actions">
                        <button class="action-icon-btn btn-edit-exp-cat" data-id="${cat.id}"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-icon-btn btn-archive-exp-cat" data-id="${cat.id}"><i class="fa-solid ${cat.isArchive ? 'fa-box-open' : 'fa-box-archive'}"></i></button>
                        <button class="action-icon-btn delete btn-delete-exp-cat" data-id="${cat.id}"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>

                <div style="margin-top: 8px;">
                    <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:4px; color: var(--text-muted);">
                        <span>Расход: <b>${Math.round(spentThisMonth).toLocaleString()} ₽</b></span>
                        <span>Лимит: ${hasBudget ? `<b>${Math.round(cat.maxBudget).toLocaleString()} ₽</b>` : '∞'}</span>
                    </div>
                    ${hasBudget ? `
                        <div style="background: #e5e7eb; height: 6px; border-radius: 3px; overflow: hidden; width:100%;">
                            <div style="background: ${progressColor}; width: ${budgetProgress}%; height: 100%; transition: width 0.3s ease;"></div>
                        </div>
                        ${isOverBudget ? `
                            <div style="color: var(--danger); font-size: 0.7rem; font-weight: 600; margin-top: 3px; text-align: right;">
                                Превышение на ${(Math.round(spentThisMonth - cat.maxBudget)).toLocaleString()} ₽!
                            </div>
                        ` : ''}
                    ` : ''}
                </div>
            `;
            area.appendChild(item);
        });
    },

    renderTransactions() {
        const area = document.getElementById('expense-transactions-area');
        if (!area) return;
        area.innerHTML = '';

        if (this.state.transactions.length === 0) {
            area.innerHTML = `<p style="color: var(--text-muted); text-align:center; padding: 20px;">Нет зарегистрированных расходов</p>`;
            return;
        }

        const sorted = [...this.state.transactions].sort((a,b) => this.parseDate(b.date) - this.parseDate(a.date));

        sorted.forEach(trans => {
            const item = document.createElement('div');
            item.className = `transaction-item ${trans.isArchive ? 'archived' : ''}`;
            item.style.borderLeft = '4px solid var(--danger)';

            item.innerHTML = `
                <div>
                    <div class="trans-title">${trans.title}</div>
                    <div class="trans-meta">
                        ${trans.date} • <span style="color: var(--danger); font-weight:500;">${trans.categoryName}</span>
                        • <span class="badge-account" style="background:#fee2e2; color:#991b1b;">${trans.accountName}</span>
                    </div>
                </div>
                <div style="display: flex; align-items: center;">
                    <span class="trans-amount" style="color: var(--danger); font-weight:700;">-${Math.round(trans.amount).toLocaleString()} ₽</span>
                    <div class="trans-actions">
                        <button class="action-icon-btn btn-edit-trans" data-id="${trans.id}"><i class="fa-solid fa-pen"></i></button>
                        <button class="action-icon-btn btn-archive-trans" data-id="${trans.id}"><i class="fa-solid ${trans.isArchive ? 'fa-box-open' : 'fa-box-archive'}"></i></button>
                        <button class="action-icon-btn delete btn-delete-trans" data-id="${trans.id}"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            `;
            area.appendChild(item);
        });
    },

    initEvents() {
        document.getElementById('btn-add-debt').addEventListener('click', () => this.openDebtModal());
        document.getElementById('btn-add-exp-cat').addEventListener('click', () => this.openCategoryModal());
        document.getElementById('btn-add-expense').addEventListener('click', () => this.openExpenseModal());
        
        document.getElementById('btn-close-debt-modal').addEventListener('click', () => this.closeModal('modal-debt'));
        document.getElementById('btn-close-sheet-modal').addEventListener('click', () => this.closeModal('modal-schedule-payment'));
        document.getElementById('btn-close-confirm-modal').addEventListener('click', () => this.closeModal('modal-confirm-pay'));
        document.getElementById('btn-close-exp-cat-modal').addEventListener('click', () => this.closeModal('modal-exp-category'));
        document.getElementById('btn-close-exp-modal').addEventListener('click', () => this.closeModal('modal-expense-form'));

        document.getElementById('btn-save-debt').addEventListener('click', () => this.saveDebt());
        document.getElementById('btn-save-sheet-payment').addEventListener('click', () => this.saveSheetPayment());
        document.getElementById('btn-execute-pay-action').addEventListener('click', () => this.executePayAction());
        document.getElementById('btn-save-exp-category').addEventListener('click', () => this.saveCategory());
        document.getElementById('btn-save-expense').addEventListener('click', () => this.saveExpense());

        this.container.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;

            const entityId = target.getAttribute('data-id');

            if (target.classList.contains('btn-edit-debt')) this.openDebtModal(entityId);
            if (target.classList.contains('btn-delete-debt')) this.deleteDebt(entityId);

            const parentDebtId = target.getAttribute('data-debt-id');
            const payId = target.getAttribute('data-pay-id');
            if (target.classList.contains('btn-add-pay-to-schedule')) this.openSheetPaymentModal(parentDebtId);
            if (target.classList.contains('btn-edit-pay')) this.openSheetPaymentModal(parentDebtId, payId);
            if (target.classList.contains('btn-delete-pay')) this.deleteSheetPayment(parentDebtId, payId);
            if (target.classList.contains('btn-pay-now')) this.openConfirmPayModal(parentDebtId, payId);

            if (target.classList.contains('btn-edit-exp-cat')) this.openCategoryModal(entityId);
            if (target.classList.contains('btn-archive-exp-cat')) this.toggleArchiveCategory(entityId);
            if (target.classList.contains('btn-delete-exp-cat')) this.deleteCategory(entityId);

            if (target.classList.contains('btn-edit-trans')) this.openExpenseModal(entityId);
            if (target.classList.contains('btn-archive-trans')) this.toggleArchiveTransaction(entityId);
            if (target.classList.contains('btn-delete-trans')) this.deleteTransaction(entityId);
        });
    },

    openCategoryModal(id = null) {
        this.state.activeEditId = id;
        const nameInp = document.getElementById('exp-cat-name-input');
        const budgetInp = document.getElementById('exp-cat-budget-input');

        if (id) {
            const cat = this.state.categories.find(c => c.id === id);
            document.getElementById('modal-exp-cat-title').innerText = "Редактировать бюджет категории";
            nameInp.value = cat.name;
            budgetInp.value = cat.maxBudget || '';
        } else {
            document.getElementById('modal-exp-cat-title').innerText = "Новая категория бюджета";
            nameInp.value = '';
            budgetInp.value = '';
        }
        document.getElementById('modal-exp-category').classList.add('active');
    },

    saveCategory() {
        const name = document.getElementById('exp-cat-name-input').value.trim();
        const budget = parseFloat(document.getElementById('exp-cat-budget-input').value) || 0;
        if (!name) return;

        if (this.state.activeEditId) {
            const cat = this.state.categories.find(c => c.id === this.state.activeEditId);
            if (cat) {
                if (cat.name !== name) {
                    this.state.transactions.forEach(t => {
                        if (t.categoryName === cat.name) t.categoryName = name;
                    });
                }
                cat.name = name;
                cat.maxBudget = budget;
            }
        } else {
            this.state.categories.push({ id: 'exp-cat-' + Date.now(), name: name, maxBudget: budget, isArchive: false });
        }
        this.closeModal('modal-exp-category');
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
        if(confirm('Удалить категорию? Расходы, привязанные к ней, потеряют привязку к лимитам.')) {
            this.state.categories = this.state.categories.filter(c => c.id !== id);
            this.renderAll();
            window.saveAppState();
        }
    },

    openDebtModal(id = null) {
        this.state.activeEditId = id;
        const nameInp = document.getElementById('debt-name-input');
        const totalInp = document.getElementById('debt-total-input');
        const remInp = document.getElementById('debt-remaining-input');

        if (id) {
            const d = this.state.debts.find(item => item.id === id);
            document.getElementById('modal-debt-title').innerText = "Редактировать обязательство";
            nameInp.value = d.name; totalInp.value = d.totalAmount; remInp.value = d.remainingAmount;
        } else {
            document.getElementById('modal-debt-title').innerText = "Новое обязательство";
            nameInp.value = ''; totalInp.value = ''; remInp.value = '';
        }
        document.getElementById('modal-debt').classList.add('active');
    },

    saveDebt() {
        const name = document.getElementById('debt-name-input').value.trim();
        const total = parseFloat(document.getElementById('debt-total-input').value) || 0;
        const remaining = parseFloat(document.getElementById('debt-remaining-input').value) || 0;
        if (!name || total <= 0) return;

        if (this.state.activeEditId) {
            const d = this.state.debts.find(item => item.id === this.state.activeEditId);
            if (d) { Object.assign(d, { name, totalAmount: total, remainingAmount: remaining }); }
        } else {
            this.state.debts.push({ id: 'debt-' + Date.now(), name, totalAmount: total, remainingAmount: remaining, payments: [] });
        }
        this.closeModal('modal-debt');
        this.renderAll();
        window.saveAppState();
    },

    deleteDebt(id) {
        if (confirm('Удалить запись об обязательстве?')) {
            this.state.debts = this.state.debts.filter(d => d.id !== id);
            this.renderAll();
            window.saveAppState();
        }
    },

    openSheetPaymentModal(debtId, payId = null) {
        this.state.activeParentDebtId = debtId;
        this.state.activeEditId = payId;
        const dateInp = document.getElementById('sheet-payment-date');
        const amountInp = document.getElementById('sheet-payment-amount');

        if (payId) {
            const debt = this.state.debts.find(d => d.id === debtId);
            const pay = debt.payments.find(p => p.id === payId);
            document.getElementById('modal-payment-title').innerText = "Изменить платеж";
            dateInp.value = pay.date; amountInp.value = pay.amount;
        } else {
            document.getElementById('modal-payment-title').innerText = "Запланировать платеж";
            dateInp.value = new Date().toISOString().split('T')[0]; amountInp.value = '';
        }
        document.getElementById('modal-schedule-payment').classList.add('active');
    },

    saveSheetPayment() {
        const date = document.getElementById('sheet-payment-date').value;
        const amount = parseFloat(document.getElementById('sheet-payment-amount').value) || 0;
        if (!date || amount <= 0) return;

        const debt = this.state.debts.find(d => d.id === this.state.activeParentDebtId);
        if (!debt) return;

        if (this.state.activeEditId) {
            const pay = debt.payments.find(p => p.id === this.state.activeEditId);
            if (pay) {
                if (pay.isPaid) debt.remainingAmount = debt.remainingAmount + pay.amount - amount;
                pay.date = date; pay.amount = amount;
            }
        } else {
            if (!debt.payments) debt.payments = [];
            debt.payments.push({ id: 'p-' + Date.now(), date, amount, isPaid: false });
        }
        debt.payments.sort((a,b) => new Date(a.date) - new Date(b.date));
        this.closeModal('modal-schedule-payment');
        this.renderAll();
        window.saveAppState();
    },

    deleteSheetPayment(debtId, payId) {
        if (confirm('Удалить платеж из графика?')) {
            const debt = this.state.debts.find(d => d.id === debtId);
            const pay = debt.payments.find(p => p.id === payId);
            if (pay && pay.isPaid) debt.remainingAmount += pay.amount;
            debt.payments = debt.payments.filter(p => p.id !== payId);
            this.renderAll();
            window.saveAppState();
        }
    },

    openConfirmPayModal(debtId, payId) {
        this.state.activeParentDebtId = debtId;
        this.state.activeEditId = payId;
        const debt = this.state.debts.find(d => d.id === debtId);
        const pay = debt.payments.find(p => p.id === payId);

        document.getElementById('confirm-pay-text').innerText = `Внесение платежа по обязательству "${debt.name}" на сумму ${Math.round(pay.amount).toLocaleString()} ₽.`;
        const accSel = document.getElementById('confirm-pay-account-select');
        const activeAccounts = window.AppState?.getAvailableAccounts ? window.AppState.getAvailableAccounts() : [];
        accSel.innerHTML = activeAccounts.map(a => `<option value="${a}">${a}</option>`).join('');
        document.getElementById('modal-confirm-pay').classList.add('active');
    },

    executePayAction() {
        const debt = this.state.debts.find(d => d.id === this.state.activeParentDebtId);
        const pay = debt.payments.find(p => p.id === this.state.activeEditId);
        const accountName = document.getElementById('confirm-pay-account-select').value;
        if (!debt || !pay || pay.isPaid) return;

        debt.remainingAmount = Math.max(0, debt.remainingAmount - pay.amount);
        pay.isPaid = true;

        const dateParts = pay.date.split('-'); 
        const humanDate = `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}`;

        this.state.transactions.push({
            id: 'exp-tr-auto-' + Date.now(),
            title: `Платеж по графику: ${debt.name}`,
            amount: pay.amount,
            categoryName: `Погашение: ${debt.name}`,
            accountName: accountName,
            date: humanDate,
            isArchive: false
        });

        this.closeModal('modal-confirm-pay');
        if (window.AppState && window.AppState.onExpenseUpdate) window.AppState.onExpenseUpdate();
        this.renderAll();
        window.saveAppState();
    },

    openExpenseModal(id = null) {
        this.state.activeEditId = id;
        const titleInp = document.getElementById('exp-title-input');
        const amountInp = document.getElementById('exp-amount-input');
        const catSel = document.getElementById('exp-category-select');
        const accSel = document.getElementById('exp-account-select');
        const dateInp = document.getElementById('exp-date-input');

        const activeAccounts = window.AppState?.getAvailableAccounts ? window.AppState.getAvailableAccounts() : [];
        accSel.innerHTML = activeAccounts.map(a => `<option value="${a}">${a}</option>`).join('');
        
        let catOptions = this.state.categories.filter(c => !c.isArchive).map(c => `<option value="${c.name}">${c.name}</option>`).join('');
        let debtOptions = this.state.debts.map(d => `<option value="Погашение: ${d.name}">Погашение: ${d.name}</option>`).join('');
        catSel.innerHTML = catOptions + (debtOptions ? `<optgroup label="Ручное погашение долгов">${debtOptions}</optgroup>` : '');

        if (id) {
            const trans = this.state.transactions.find(t => t.id === id);
            document.getElementById('modal-expense-title').innerText = "Изменить расход";
            titleInp.value = trans.title; amountInp.value = trans.amount;
            catSel.value = trans.categoryName; accSel.value = trans.accountName; dateInp.value = trans.date;
        } else {
            document.getElementById('modal-expense-title').innerText = "Внести расход вручную";
            titleInp.value = ''; amountInp.value = ''; dateInp.value = this.getTodayString();
        }
        document.getElementById('modal-expense-form').classList.add('active');
    },

    saveExpense() {
        const title = document.getElementById('exp-title-input').value.trim() || 'Прочий расход';
        const amount = parseFloat(document.getElementById('exp-amount-input').value) || 0;
        const categoryName = document.getElementById('exp-category-select').value;
        const accountName = document.getElementById('exp-account-select').value;
        const date = document.getElementById('exp-date-input').value.trim() || this.getTodayString();

        if (amount <= 0 || !accountName) return;

        if (this.state.activeEditId) {
            const trans = this.state.transactions.find(t => t.id === this.state.activeEditId);
            if (trans) {
                this.manageDebtRelation(trans.categoryName, -trans.amount);
                Object.assign(trans, { title, amount, categoryName, accountName, date });
                this.manageDebtRelation(categoryName, amount);
            }
        } else {
            this.state.transactions.push({ id: 'exp-tr-' + Date.now(), title, amount, categoryName, accountName, date, isArchive: false });
            this.manageDebtRelation(categoryName, amount);
        }
        
        this.closeModal('modal-expense-form');
        if(window.AppState && window.AppState.onExpenseUpdate) window.AppState.onExpenseUpdate();
        this.renderAll();
        window.saveAppState();
    },

    manageDebtRelation(categoryName, amount) {
        if(categoryName.startsWith("Погашение: ")) {
            const debtName = categoryName.replace("Погашение: ", "");
            const debt = this.state.debts.find(d => d.name === debtName);
            if(debt) debt.remainingAmount = Math.max(0, debt.remainingAmount - amount);
        }
    },

    toggleArchiveTransaction(id) {
        const trans = this.state.transactions.find(t => t.id === id);
        if (trans) {
            trans.isArchive = !trans.isArchive;
            this.manageDebtRelation(trans.categoryName, trans.isArchive ? -trans.amount : trans.amount);
        }
        if(window.AppState && window.AppState.onExpenseUpdate) window.AppState.onExpenseUpdate();
        this.renderAll();
        window.saveAppState();
    },

    deleteTransaction(id) {
        if(confirm('Удалить запись о расходе?')) {
            const trans = this.state.transactions.find(t => t.id === id);
            if(trans && !trans.isArchive) this.manageDebtRelation(trans.categoryName, -trans.amount);
            this.state.transactions = this.state.transactions.filter(t => t.id !== id);
            if(window.AppState && window.AppState.onExpenseUpdate) window.AppState.onExpenseUpdate();
            this.renderAll();
            window.saveAppState();
        }
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        this.state.activeEditId = null; this.state.activeParentDebtId = null;
    },

    getTodayString() {
        const t = new Date();
        return `${String(t.getDate()).padStart(2,'0')}.${String(t.getMonth()+1).padStart(2,'0')}.${t.getFullYear()}`;
    },

    getCurrentMonthYearString() {
        const t = new Date();
        return `${String(t.getMonth() + 1).padStart(2, '0')}.${t.getFullYear()}`;
    },

    convertInputDateToHuman(dateStr) {
        if(!dateStr) return '';
        const p = dateStr.split('-'); 
        return `${p[2]}.${p[1]}.${p[0]}`; 
    },

    parseDate(str) {
        const p = str.split('.');
        return new Date(p[2], p[1] - 1, p[0]);
    }
};