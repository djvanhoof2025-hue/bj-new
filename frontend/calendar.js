export const CalendarModule = {
    state: {
        currentYear: new Date().getFullYear(),
        currentQuarter: Math.floor(new Date().getMonth() / 3),
        currentMonth: new Date().getMonth(),
        viewMode: 'quarter',
        activeDayKey: null,
        activeMonthKey: null, // для редактирования месячной ставки
        monthlyRates: {},
        dayData: {},
        monthNames: ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
    },

    init(containerId) {
        this.container = document.getElementById(containerId);
        this.renderLayout();
        this.initModalLogic();
        this.renderCalendar();
        this.initNavEvents();
    },

    renderLayout() {
        this.container.innerHTML = `
            <div class="calendar-controls">
                <h2 style="font-weight: 500; font-size: 1.4rem;">Контроль рабочих смен</h2>
                <div class="calendar-nav-group">
                    <div class="view-switcher">
                        <button class="view-btn active" id="btn-quarter">Квартал</button>
                        <button class="view-btn" id="btn-month">Месяц</button>
                    </div>
                    <button class="btn" id="btn-prev-period"><i class="fa-solid fa-chevron-left"></i></button>
                    <span style="font-weight: 500; min-width: 130px; text-align: center; font-size: 0.95rem;" id="calendar-label"></span>
                    <button class="btn" id="btn-next-period"><i class="fa-solid fa-chevron-right"></i></button>
                </div>
            </div>
            <div class="calendar-grid" id="calendar-render-area"></div>

            <!-- Модальное окно для дня -->
            <div class="modal-overlay" id="modal-day">
                <div class="modal">
                    <div class="modal-header"><h3 id="modal-day-title">Учет дня</h3></div>
                    <div class="form-group">
                        <label>Ставка за смену (₽) <span style="color:var(--text-muted);">(если пусто — используется месячная ставка)</span></label>
                        <input type="number" step="100" id="day-rate-input" placeholder="Например: 2500" inputmode="decimal">
                    </div>
                    <div class="form-group" id="coef-input-container">
                        <label>Коэффициент смены в типографии</label>
                        <input type="number" step="0.1" id="day-coef-input" placeholder="0" inputmode="decimal">
                    </div>
                    <div class="checkbox-group">
                        <label class="checkbox-item"><input type="checkbox" id="check-weekend"><span>Выходной (Красный)</span></label>
                        <label class="checkbox-item"><input type="checkbox" id="check-sick"><span>Больничный (Серый)</span></label>
                        <label class="checkbox-item"><input type="checkbox" id="check-dj"><span>EventDj (Фиолетовый)</span></label>
                    </div>
                    <div class="dynamic-section" id="dj-fee-container">
                        <div class="form-group" style="margin-bottom: 0;">
                            <label>Сумма гонорара DJ (₽)</label>
                            <input type="number" id="dj-fee-input" placeholder="0" inputmode="numeric">
                        </div>
                    </div>
                    <div style="border-top: 1px solid var(--border-color); margin-top: 15px; padding-top: 5px;">
                        <button type="button" class="add-extra-btn" id="btn-add-extra">
                            <i class="fa-solid fa-circle-plus"></i> Ввести дополнительный доход
                        </button>
                        <div id="extra-incomes-list" style="margin-top: 10px;"></div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn" id="btn-close-modal">Отмена</button>
                        <button class="btn btn-filled" id="save-day-btn">Сохранить</button>
                    </div>
                </div>
            </div>

            <!-- НОВОЕ МОДАЛЬНОЕ ОКНО для редактирования месячной ставки -->
            <div class="modal-overlay" id="modal-month-rate">
                <div class="modal">
                    <div class="modal-header"><h3 id="modal-month-title">Базовая ставка месяца</h3></div>
                    <div class="form-group">
                        <label>Ставка за смену в этом месяце (₽)</label>
                        <input type="number" step="100" id="month-rate-input" placeholder="0" inputmode="decimal">
                        <div style="font-size:0.7rem; color:var(--text-muted); margin-top:5px;">Эта ставка будет использоваться для дней, у которых не указана своя ставка.</div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn" id="btn-close-month-modal">Отмена</button>
                        <button class="btn btn-filled" id="save-month-btn">Сохранить</button>
                    </div>
                </div>
            </div>
        `;
    },

    getDayBackground(data, coefVal) {
        let typoColor = 'var(--status-normal)';
        let isTypoWorking = coefVal > 0;

        if (data.weekend) typoColor = 'var(--status-weekend)';
        else if (data.sick) typoColor = 'var(--status-sick)';
        else if (isTypoWorking) {
            if (coefVal < 1.0) typoColor = 'var(--status-low)';
            else if (coefVal > 1.0) typoColor = 'var(--status-high)';
            else typoColor = '#ffffff';
        }

        if (data.dj) {
            if (isTypoWorking || data.weekend || data.sick) {
                return `linear-gradient(90deg, ${typoColor} 50%, var(--status-dj) 50%)`;
            } else {
                return 'var(--status-dj)';
            }
        }
        return typoColor;
    },

    renderCalendar() {
        const container = document.getElementById('calendar-render-area');
        if (!container) return;
        container.innerHTML = '';
        
        if (this.state.viewMode === 'quarter') {
            const quarterRoman = ['I', 'II', 'III', 'IV'];
            document.getElementById('calendar-label').innerText = `${quarterRoman[this.state.currentQuarter]} Квартал ${this.state.currentYear}`;
        } else {
            document.getElementById('calendar-label').innerText = `${this.state.monthNames[this.state.currentMonth]} ${this.state.currentYear}`;
        }

        let monthsToRender = [];
        if (this.state.viewMode === 'quarter') {
            const startMonth = this.state.currentQuarter * 3;
            monthsToRender = [startMonth, startMonth + 1, startMonth + 2];
        } else {
            monthsToRender = [this.state.currentMonth];
        }

        monthsToRender.forEach(monthIdx => {
            const monthKey = `${this.state.currentYear}-${monthIdx}`;
            const baseRate = this.state.monthlyRates[monthKey] || 0;

            const monthView = document.createElement('div');
            monthView.className = 'month-view';

            const header = document.createElement('div');
            header.className = 'month-header';
            header.innerHTML = `
                <span class="month-title">${this.state.monthNames[monthIdx]}</span>
                <button class="btn-edit-month-rate" data-year="${this.state.currentYear}" data-month="${monthIdx}" style="background:none; border:none; cursor:pointer; color:var(--accent); font-size:0.7rem;" title="Редактировать базовую ставку месяца">
                    <i class="fa-solid fa-pen"></i> ${baseRate}₽
                </button>
            `;
            monthView.appendChild(header);

            const daysGrid = document.createElement('div');
            daysGrid.className = 'days-grid';
            ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].forEach(d => {
                const l = document.createElement('div'); l.className = 'day-label'; l.innerText = d; daysGrid.appendChild(l);
            });

            const firstDay = new Date(this.state.currentYear, monthIdx, 1);
            let startDayOfWeek = firstDay.getDay() - 1;
            if (startDayOfWeek === -1) startDayOfWeek = 6;
            const daysInMonth = new Date(this.state.currentYear, monthIdx + 1, 0).getDate();

            for (let i = 0; i < startDayOfWeek; i++) {
                const empty = document.createElement('div'); empty.className = 'day empty'; daysGrid.appendChild(empty);
            }

            let totalMonthEarned = 0;
            const today = new Date();

            for (let d = 1; d <= daysInMonth; d++) {
                const dayKey = `${monthKey}-${d}`;
                const data = this.state.dayData[dayKey] || { coef: 0, weekend: false, sick: false, dj: false, djFee: 0, extras: [], dailyRate: null };
                
                const dayCell = document.createElement('div');
                dayCell.className = 'day';
                dayCell.onclick = () => this.openDayModal(dayKey, d, this.state.monthNames[monthIdx]);

                if (today.getFullYear() === this.state.currentYear && today.getMonth() === monthIdx && today.getDate() === d) {
                    dayCell.classList.add('today');
                }

                let coefVal = parseFloat(data.coef);
                if (isNaN(coefVal)) coefVal = 0;
                let isTypoWorking = coefVal > 0;

                dayCell.style.background = this.getDayBackground(data, coefVal);

                // Определяем ставку: индивидуальная дневная (если есть), иначе месячная
                let rate = (data.dailyRate !== null && data.dailyRate !== undefined && data.dailyRate > 0) ? data.dailyRate : baseRate;
                
                let daySum = 0;
                if (isTypoWorking && !data.weekend && !data.sick && rate > 0) {
                    daySum += (rate * coefVal);
                }
                if (data.dj && data.djFee) {
                    daySum += parseFloat(data.djFee) || 0;
                }
                if (data.extras && data.extras.length > 0) {
                    data.extras.forEach(item => { daySum += parseFloat(item.price) || 0; });
                }

                totalMonthEarned += daySum;

                let innerHTML = `<span class="day-num">${d}</span>`;
                if (isTypoWorking && !data.weekend && !data.sick) {
                    innerHTML += `<span class="day-coef">${coefVal}</span>`;
                }
                
                if (data.dj) {
                    innerHTML += `<span class="dj-icon"><i class="fa-solid fa-compact-disc"></i></span>`;
                }
                if (data.extras && data.extras.length > 0) {
                    innerHTML += `<span class="extra-icon"><i class="fa-solid fa-wallet"></i></span>`;
                }

                if (daySum > 0) {
                    innerHTML += `<span class="day-money">${Math.round(daySum).toLocaleString()}₽</span>`;
                }

                dayCell.innerHTML = innerHTML;
                daysGrid.appendChild(dayCell);
            }

            monthView.appendChild(daysGrid);

            const footer = document.createElement('div');
            footer.className = 'month-footer';
            footer.innerHTML = `
                <span class="month-rate">Ставка месяца: ${baseRate}₽</span>
                <span class="month-total">${totalMonthEarned > 0 ? `Итог: ${Math.round(totalMonthEarned).toLocaleString()}₽` : ''}</span>
            `;
            monthView.appendChild(footer);
            container.appendChild(monthView);
        });

        // Навешиваем обработчики на кнопки редактирования ставок месяцев
        document.querySelectorAll('.btn-edit-month-rate').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const year = parseInt(btn.dataset.year);
                const month = parseInt(btn.dataset.month);
                this.openMonthRateModal(year, month);
            });
        });
    },

    // Открыть модалку для редактирования месячной ставки
    openMonthRateModal(year, month) {
        this.state.activeMonthKey = `${year}-${month}`;
        const currentRate = this.state.monthlyRates[this.state.activeMonthKey] || 0;
        document.getElementById('month-rate-input').value = currentRate;
        document.getElementById('modal-month-title').innerText = `Базовая ставка для ${this.state.monthNames[month]} ${year}`;
        document.getElementById('modal-month-rate').classList.add('active');
    },

    // Сохранить месячную ставку
    saveMonthRate() {
        const newRate = parseFloat(document.getElementById('month-rate-input').value) || 0;
        if (this.state.activeMonthKey) {
            if (newRate > 0) {
                this.state.monthlyRates[this.state.activeMonthKey] = newRate;
            } else {
                delete this.state.monthlyRates[this.state.activeMonthKey];
            }
            this.closeModal('modal-month-rate');
            this.renderCalendar();
            if (window.AppState && window.AppState.onCalendarUpdate) window.AppState.onCalendarUpdate();
            window.saveAppState();
        }
    },

    initModalLogic() {
        const chkWeekend = document.getElementById('check-weekend');
        const chkSick = document.getElementById('check-sick');
        const chkDj = document.getElementById('check-dj');
        const inputCoef = document.getElementById('day-coef-input');
        const djContainer = document.getElementById('dj-fee-container');
        const btnAddExtra = document.getElementById('btn-add-extra');
        const btnClose = document.getElementById('btn-close-modal');
        const btnSave = document.getElementById('save-day-btn');

        // Обработчики для модалки дня (без изменений)
        chkWeekend.addEventListener('change', () => {
            if (chkWeekend.checked) {
                chkSick.checked = false; chkDj.checked = false;
                inputCoef.value = ''; inputCoef.disabled = true;
                djContainer.classList.remove('active');
            } else { inputCoef.disabled = false; }
        });

        chkSick.addEventListener('change', () => {
            if (chkSick.checked) {
                chkWeekend.checked = false; chkDj.checked = false;
                inputCoef.value = ''; inputCoef.disabled = true;
                djContainer.classList.remove('active');
            } else { inputCoef.disabled = false; }
        });

        chkDj.addEventListener('change', () => {
            if (chkDj.checked) {
                chkWeekend.checked = false; chkSick.checked = false;
                inputCoef.disabled = false;
                djContainer.classList.add('active');
            } else { djContainer.classList.remove('active'); }
        });

        btnAddExtra.addEventListener('click', () => this.addExtraIncomeRow('', ''));
        btnClose.addEventListener('click', () => this.closeModal('modal-day'));
        btnSave.addEventListener('click', () => this.saveDayData());

        // Обработчики для модалки месячной ставки
        document.getElementById('btn-close-month-modal').addEventListener('click', () => this.closeModal('modal-month-rate'));
        document.getElementById('save-month-btn').addEventListener('click', () => this.saveMonthRate());
    },

    addExtraIncomeRow(name = '', price = '') {
        const container = document.getElementById('extra-incomes-list');
        const row = document.createElement('div');
        row.className = 'extra-income-row';
        row.innerHTML = `
            <input type="text" placeholder="Наименование" class="extra-name" value="${name.replace(/"/g, '&quot;')}">
            <input type="number" placeholder="Стоимость" class="extra-price" value="${price}" inputmode="numeric">
            <button type="button" class="remove-extra-row" onclick="this.parentElement.remove()"><i class="fa-solid fa-trash-can"></i></button>
        `;
        container.appendChild(row);
    },

    openDayModal(key, dayNum, monthName) {
        this.state.activeDayKey = key;
        const data = this.state.dayData[key] || { coef: 0, weekend: false, sick: false, dj: false, djFee: '', extras: [], dailyRate: null };

        document.getElementById('modal-day-title').innerText = `${dayNum} ${monthName}`;
        document.getElementById('day-coef-input').value = data.coef || '';
        document.getElementById('day-rate-input').value = (data.dailyRate !== null && data.dailyRate !== undefined) ? data.dailyRate : '';
        document.getElementById('check-weekend').checked = data.weekend;
        document.getElementById('check-sick').checked = data.sick;
        document.getElementById('check-dj').checked = data.dj;
        document.getElementById('dj-fee-input').value = data.djFee || '';

        const djContainer = document.getElementById('dj-fee-container');
        if (data.dj) djContainer.classList.add('active'); else djContainer.classList.remove('active');

        document.getElementById('day-coef-input').disabled = (data.weekend || data.sick);

        document.getElementById('extra-incomes-list').innerHTML = '';
        if (data.extras && data.extras.length > 0) {
            data.extras.forEach(item => this.addExtraIncomeRow(item.name, item.price));
        }

        document.getElementById('modal-day').classList.add('active');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
        if (modalId === 'modal-day') this.state.activeDayKey = null;
        if (modalId === 'modal-month-rate') this.state.activeMonthKey = null;
    },

    saveDayData() {
        const isWeekend = document.getElementById('check-weekend').checked;
        const isSick = document.getElementById('check-sick').checked;
        const isDj = document.getElementById('check-dj').checked;
        
        let coefVal = parseFloat(document.getElementById('day-coef-input').value);
        if (isNaN(coefVal) || isWeekend || isSick) coefVal = 0;

        let djFeeVal = parseFloat(document.getElementById('dj-fee-input').value) || 0;
        
        let dailyRateVal = parseFloat(document.getElementById('day-rate-input').value);
        if (isNaN(dailyRateVal)) dailyRateVal = null;

        const extraRows = document.querySelectorAll('.extra-income-row');
        const extrasArray = [];
        extraRows.forEach(row => {
            const name = row.querySelector('.extra-name').value.trim();
            const price = parseFloat(row.querySelector('.extra-price').value) || 0;
            if (name !== '' || price > 0) {
                extrasArray.push({ name: name, price: price });
            }
        });

        this.state.dayData[this.state.activeDayKey] = {
            coef: coefVal,
            weekend: isWeekend,
            sick: isSick,
            dj: isDj,
            djFee: isDj ? djFeeVal : 0,
            extras: extrasArray,
            dailyRate: dailyRateVal
        };

        this.closeModal('modal-day');
        this.renderCalendar();
        if (window.AppState && window.AppState.onCalendarUpdate) window.AppState.onCalendarUpdate();
        window.saveAppState();
    },

    initNavEvents() {
        document.getElementById('btn-prev-period').addEventListener('click', () => {
            if (this.state.viewMode === 'quarter') {
                if (this.state.currentQuarter > 0) { this.state.currentQuarter--; } else { this.state.currentQuarter = 3; this.state.currentYear--; }
                this.state.currentMonth = this.state.currentQuarter * 3; 
            } else {
                if (this.state.currentMonth > 0) { this.state.currentMonth--; } else { this.state.currentMonth = 11; this.state.currentYear--; }
                this.state.currentQuarter = Math.floor(this.state.currentMonth / 3); 
            }
            this.renderCalendar();
        });

        document.getElementById('btn-next-period').addEventListener('click', () => {
            if (this.state.viewMode === 'quarter') {
                if (this.state.currentQuarter < 3) { this.state.currentQuarter++; } else { this.state.currentQuarter = 0; this.state.currentYear++; }
                this.state.currentMonth = this.state.currentQuarter * 3;
            } else {
                if (this.state.currentMonth < 11) { this.state.currentMonth++; } else { this.state.currentMonth = 0; this.state.currentYear++; }
                this.state.currentQuarter = Math.floor(this.state.currentMonth / 3);
            }
            this.renderCalendar();
        });

        const qBtn = document.getElementById('btn-quarter');
        const mBtn = document.getElementById('btn-month');

        qBtn.addEventListener('click', () => {
            mBtn.classList.remove('active'); qBtn.classList.add('active');
            this.state.viewMode = 'quarter'; this.renderCalendar();
        });

        mBtn.addEventListener('click', () => {
            qBtn.classList.remove('active'); mBtn.classList.add('active');
            this.state.viewMode = 'month'; this.renderCalendar();
        });
    }
};