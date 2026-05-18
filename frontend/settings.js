export const SettingsModule = {
    containerId: null,
    
    config: {
        dbHost: 'localhost',
        dbName: 'typo_budget',
        dbUser: 'root',
        dbPassword: ''
    },

    init(containerId) {
        this.containerId = containerId;
        const savedConfig = localStorage.getItem('typo_db_config');
        if (savedConfig) {
            this.config = JSON.parse(savedConfig);
        }
        this.render();
    },

    render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        container.innerHTML = `
            <div style="max-width: 800px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <h2 style="font-weight: 600; margin-bottom: 20px; font-size: 1.3rem; display: flex; align-items: center; gap: 10px;">
                    <i class="fa-solid fa-database" style="color: var(--accent);"></i> Синхронизация с базой данных
                </h2>
                
                <form id="db-config-form" style="display: flex; flex-direction: column; gap: 15px;">
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">Имя сервера (Хост)</label>
                        <input type="text" id="dbHost" value="${this.config.dbHost}" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.95rem;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">Имя базы данных</label>
                        <input type="text" id="dbName" value="${this.config.dbName}" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.95rem;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">Имя пользователя</label>
                        <input type="text" id="dbUser" value="${this.config.dbUser}" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.95rem;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        <label style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">Пароль пользователя</label>
                        <input type="password" id="dbPassword" value="${this.config.dbPassword}" style="padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; font-size: 0.95rem;" placeholder="Введите пароль базы данных">
                    </div>
                    <div style="padding-top: 10px; display: flex; gap: 10px; flex-wrap: wrap;">
                        <button type="button" id="btn-save-config" class="btn btn-filled">Сохранить конфиг</button>
                        <button type="button" id="btn-test-db" class="btn"><i class="fa-solid fa-plug"></i> Тест связи</button>
                    </div>
                </form>

                <hr style="margin: 30px 0; border: 0; border-top: 1px solid var(--border-color);">

                <h3 style="font-weight: 600; margin-bottom: 15px; font-size: 1.1rem;">Обмен данными с сервером</h3>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 30px;">
                    <button type="button" id="btn-export-db" class="btn" style="border-color: var(--success); color: var(--success);"><i class="fa-solid fa-cloud-arrow-up"></i> Выгрузить в БД</button>
                    <button type="button" id="btn-import-db" class="btn" style="border-color: var(--warning); color: var(--warning);"><i class="fa-solid fa-cloud-arrow-down"></i> Загрузить из БД</button>
                </div>

                <hr style="margin: 30px 0; border: 0; border-top: 1px solid var(--border-color);">

                <h3 style="font-weight: 600; margin-bottom: 15px; font-size: 1.1rem;">Локальное резервное копирование</h3>
                <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 15px;">
                    <button type="button" id="btn-save-local-backup" class="btn btn-filled" style="background: var(--success); border-color: var(--success);"><i class="fa-solid fa-floppy-disk"></i> Сохранить локальную копию</button>
                    <button type="button" id="btn-restore-local-backup" class="btn"><i class="fa-solid fa-rotate-left"></i> Восстановить из локальной копии</button>
                </div>
                <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px;">
                    📄 <span id="local-backup-info">—</span>
                </div>

                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    <button type="button" id="btn-export-file" class="btn"><i class="fa-solid fa-file-export"></i> Экспорт в JSON-файл</button>
                    <label for="import-file-input" class="btn" style="cursor: pointer; background: var(--bg-card);"><i class="fa-solid fa-file-import"></i> Импорт из JSON-файла</label>
                    <input type="file" id="import-file-input" accept=".json" style="display: none;">
                </div>

                <div id="db-status-message" style="margin-top: 20px; padding: 12px; border-radius: 6px; font-size: 0.9rem; display: none;"></div>
            </div>
        `;
        this.bindEvents();
        this.updateLocalBackupInfo();
    },

    bindEvents() {
        document.getElementById('btn-save-config').addEventListener('click', () => this.saveConfig());
        document.getElementById('btn-test-db').addEventListener('click', () => this.testConnection());
        document.getElementById('btn-export-db').addEventListener('click', () => this.exportData());
        document.getElementById('btn-import-db').addEventListener('click', () => this.importData());
        document.getElementById('btn-save-local-backup').addEventListener('click', () => this.saveLocalBackup());
        document.getElementById('btn-restore-local-backup').addEventListener('click', () => this.restoreFromLocalBackup());
        document.getElementById('btn-export-file').addEventListener('click', () => this.exportToFile());
        const fileInput = document.getElementById('import-file-input');
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.importFromFile(e.target.files[0]);
                fileInput.value = '';
            }
        });
    },

    showStatus(text, type = 'info') {
        const msgBlock = document.getElementById('db-status-message');
        if (!msgBlock) return;
        msgBlock.style.display = 'block';
        msgBlock.innerText = text;
        if (type === 'success') {
            msgBlock.style.background = '#ecfdf5';
            msgBlock.style.color = 'var(--success)';
            msgBlock.style.border = '1px solid #a7f3d0';
        } else if (type === 'error') {
            msgBlock.style.background = '#fef2f2';
            msgBlock.style.color = 'var(--danger)';
            msgBlock.style.border = '1px solid #fca5a5';
        } else {
            msgBlock.style.background = '#f3f4f6';
            msgBlock.style.color = 'var(--text-main)';
            msgBlock.style.border = '1px solid var(--border-color)';
        }
        setTimeout(() => {
            if (msgBlock) msgBlock.style.display = 'none';
        }, 4000);
    },

    saveConfig() {
        this.config.dbHost = document.getElementById('dbHost').value;
        this.config.dbName = document.getElementById('dbName').value;
        this.config.dbUser = document.getElementById('dbUser').value;
        this.config.dbPassword = document.getElementById('dbPassword').value;
        localStorage.setItem('typo_db_config', JSON.stringify(this.config));
        this.showStatus('Конфигурация подключения сохранена локально!', 'success');
    },

    async testConnection() {
        this.config.dbHost = document.getElementById('dbHost').value;
        this.config.dbName = document.getElementById('dbName').value;
        this.config.dbUser = document.getElementById('dbUser').value;
        this.config.dbPassword = document.getElementById('dbPassword').value;
        this.showStatus('Проверка соединения...');
        try {
            const response = await fetch('/api/db/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.config)
            });
            const data = await response.json();
            if (response.ok && data.success) {
                this.showStatus('Связь с базой данных успешно установлена!', 'success');
            } else {
                this.showStatus(`Ошибка подключения: ${data.message || 'неизвестно'}`, 'error');
            }
        } catch (error) {
            this.showStatus(`Не удалось связаться с сервером API: ${error.message}`, 'error');
        }
    },

    async exportData() {
        this.config.dbHost = document.getElementById('dbHost').value;
        this.config.dbName = document.getElementById('dbName').value;
        this.config.dbUser = document.getElementById('dbUser').value;
        this.config.dbPassword = document.getElementById('dbPassword').value;
        this.showStatus('Выгрузка локальных данных на сервер...');
        const payload = {
            config: this.config,
            data: {
                calendar: window.CalendarModule?.state?.dayData || {},
                monthlyRates: window.CalendarModule?.state?.monthlyRates || {},
                accounts: window.IncomeModule?.state || {}, 
                expenseTransactions: window.ExpenseModule?.state || {}
            }
        };
        try {
            const response = await fetch('/api/db/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            if (response.ok && data.success) {
                this.showStatus('Данные успешно сохранены в БД!', 'success');
                window.saveAppState();
            } else {
                this.showStatus(`Ошибка выгрузки: ${data.message}`, 'error');
            }
        } catch (error) {
            this.showStatus(`Ошибка отправки данных: ${error.message}`, 'error');
        }
    },

    async importData() {
        this.config.dbHost = document.getElementById('dbHost').value;
        this.config.dbName = document.getElementById('dbName').value;
        this.config.dbUser = document.getElementById('dbUser').value;
        this.config.dbPassword = document.getElementById('dbPassword').value;
        this.showStatus('Загрузка данных из БД...');
        try {
            const response = await fetch('/api/db/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.config)
            });
            const resData = await response.json();
            if (response.ok && resData.success) {
                const incoming = resData.data;
                const fullState = {
                    calendar: {
                        dayData: incoming.calendar || {},
                        monthlyRates: incoming.monthlyRates || {},
                    },
                    income: incoming.accounts || { accounts: [], categories: [], manualTransactions: [] },
                    expense: incoming.expenseTransactions || { categories: [], debts: [], transactions: [] },
                    savedAt: new Date().toISOString()
                };
                if (window.applyFullAppState(fullState)) {
                    this.showStatus('Данные из БД успешно загружены!', 'success');
                    window.saveAppState();
                } else {
                    this.showStatus('Ошибка применения данных из БД', 'error');
                }
            } else {
                this.showStatus(`Не удалось загрузить данные: ${resData.message}`, 'error');
            }
        } catch (error) {
            this.showStatus(`Ошибка при получении данных: ${error.message}`, 'error');
        }
    },

    updateLocalBackupInfo() {
        const infoSpan = document.getElementById('local-backup-info');
        if (!infoSpan) return;
        const raw = localStorage.getItem('typo_full_backup');
        if (!raw) {
            infoSpan.innerText = 'Нет сохранённой копии';
            return;
        }
        try {
            const state = JSON.parse(raw);
            const date = new Date(state.savedAt).toLocaleString();
            infoSpan.innerText = `Сохранено: ${date}`;
        } catch (e) {
            infoSpan.innerText = 'Ошибка чтения копии';
        }
    },

    saveLocalBackup() {
        window.saveAppState();
        this.showStatus('✅ Локальная копия сохранена', 'success');
    },

    restoreFromLocalBackup() {
        if (window.loadAppState()) {
            this.showStatus('✅ Данные восстановлены из локальной копии', 'success');
        } else {
            this.showStatus('❌ Локальная копия не найдена или повреждена', 'error');
        }
    },

    exportToFile() {
        const state = window.getFullAppState();
        const dataStr = JSON.stringify(state, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `typo_budget_backup_${new Date().toISOString().slice(0,19)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showStatus('📁 Экспорт в файл выполнен', 'success');
    },

    importFromFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const state = JSON.parse(e.target.result);
                if (window.applyFullAppState(state)) {
                    this.showStatus('✅ Импорт из файла успешен', 'success');
                    window.saveAppState();
                } else {
                    this.showStatus('❌ Ошибка применения данных из файла', 'error');
                }
            } catch (err) {
                this.showStatus(`❌ Ошибка чтения файла: ${err.message}`, 'error');
            }
        };
        reader.readAsText(file);
    }
};