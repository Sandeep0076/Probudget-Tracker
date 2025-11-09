import { Transaction, TransactionType, Budget, Category, RecurringTransaction, Saving, ActivityLog } from '../types';

// sql.js is loaded globally from index.html
declare const initSqlJs: any;

export const OVERALL_BUDGET_CATEGORY = '##OVERALL_BUDGET##';

const seedDefaultCategories = (db: any) => {
    console.log("[DB Seed] Seeding default categories...");
    const expenseCategories = ['Groceries', 'Utilities', 'Transport', 'Entertainment', 'Health', 'Dining Out', 'Shopping', 'Other'];
    const incomeCategories = ['Salary', 'Stocks', 'Gifts', 'Other'];

    const insertQuery = `INSERT INTO categories (id, name, type, isDefault) VALUES (?, ?, ?, ?)`;

    try {
        db.run('BEGIN TRANSACTION;');
        expenseCategories.forEach(name => {
            db.run(insertQuery, [crypto.randomUUID(), name, TransactionType.EXPENSE, 1]);
        });
        incomeCategories.forEach(name => {
            db.run(insertQuery, [crypto.randomUUID(), name, TransactionType.INCOME, 1]);
        });
        db.run('COMMIT;');
        console.log("[DB Seed] Default categories seeded successfully.");
    } catch (error) {
        db.run('ROLLBACK;');
        console.error("[DB Seed] Error seeding default categories:", error);
    }
};

const ensureTablesExist = (db: any) => {
    db.run(`
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            description TEXT,
            amount REAL,
            date TEXT,
            type TEXT,
            category TEXT,
            quantity INTEGER DEFAULT 1,
            recurring_transaction_id TEXT,
            FOREIGN KEY (recurring_transaction_id) REFERENCES recurring_transactions(id) ON DELETE SET NULL
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS budgets (
            id TEXT PRIMARY KEY,
            category TEXT,
            amount REAL,
            month INTEGER,
            year INTEGER,
            UNIQUE(category, month, year)
        );
    `);
     db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            isDefault INTEGER DEFAULT 0,
            UNIQUE(name, type)
        );
    `);
     db.run(`
        CREATE TABLE IF NOT EXISTS labels (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS transaction_labels (
            transaction_id TEXT NOT NULL,
            label_id TEXT NOT NULL,
            PRIMARY KEY (transaction_id, label_id),
            FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
            FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS recurring_transactions (
            id TEXT PRIMARY KEY,
            description TEXT,
            amount REAL,
            type TEXT,
            category TEXT,
            start_date TEXT,
            frequency TEXT,
            day_of_month INTEGER
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS recurring_transaction_labels (
            recurring_transaction_id TEXT NOT NULL,
            label_id TEXT NOT NULL,
            PRIMARY KEY (recurring_transaction_id, label_id),
            FOREIGN KEY (recurring_transaction_id) REFERENCES recurring_transactions(id) ON DELETE CASCADE,
            FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS savings (
            id TEXT PRIMARY KEY,
            amount REAL,
            month INTEGER,
            year INTEGER,
            UNIQUE(month, year)
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS activity_log (
            id TEXT PRIMARY KEY,
            timestamp TEXT NOT NULL,
            action TEXT NOT NULL,
            description TEXT NOT NULL
        );
    `);
}

export const createNewDatabase = async (): Promise<any> => {
    console.log("[DB] Creating new in-memory database...");
    const SQL = await initSqlJs({
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });
    const db = new SQL.Database();
    ensureTablesExist(db);
    seedDefaultCategories(db);
    console.log("[DB] New database created with default categories.");
    return db;
};

export const loadDatabase = async (dbFile: Uint8Array): Promise<any> => {
    console.log("[DB] Loading database from file...");
    const SQL = await initSqlJs({
        locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
    });
    const db = new SQL.Database(dbFile);
    ensureTablesExist(db); // Ensure schema is up to date
    console.log("[DB] Database loaded successfully.");
    return db;
};

export const addTransaction = async (db: any, transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    const newTransaction: Transaction = {
        ...transaction,
        id: crypto.randomUUID(),
    };
    
    try {
        db.run('BEGIN TRANSACTION;');

        db.run(
            'INSERT INTO transactions (id, description, amount, date, type, category, quantity, recurring_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [newTransaction.id, newTransaction.description, newTransaction.amount, newTransaction.date, newTransaction.type, newTransaction.category, newTransaction.quantity, newTransaction.recurringTransactionId || null]
        );

        if (transaction.labels && transaction.labels.length > 0) {
            for (const labelName of transaction.labels) {
                let labelId;
                
                const selectStmt = db.prepare("SELECT id FROM labels WHERE name = ?");
                selectStmt.bind([labelName]);
                
                if (selectStmt.step()) {
                    labelId = selectStmt.get()[0];
                } else {
                    labelId = crypto.randomUUID();
                    db.run("INSERT INTO labels (id, name) VALUES (?, ?)", [labelId, labelName]);
                }
                selectStmt.free();

                db.run("INSERT INTO transaction_labels (transaction_id, label_id) VALUES (?, ?)", [newTransaction.id, labelId]);
            }
        }

        db.run('COMMIT;');
        return newTransaction;
    } catch (error) {
        console.error("[DB Write] FAILED to add transaction:", error);
        db.run('ROLLBACK;');
        throw error;
    }
};

export const updateTransaction = async (db: any, transaction: Transaction): Promise<void> => {
    try {
        db.run('BEGIN TRANSACTION;');

        db.run(
            'UPDATE transactions SET description = ?, amount = ?, date = ?, type = ?, category = ?, quantity = ? WHERE id = ?',
            [transaction.description, transaction.amount, transaction.date, transaction.type, transaction.category, transaction.quantity, transaction.id]
        );

        db.run('DELETE FROM transaction_labels WHERE transaction_id = ?', [transaction.id]);

        if (transaction.labels && transaction.labels.length > 0) {
            for (const labelName of transaction.labels) {
                let labelId;
                const selectStmt = db.prepare("SELECT id FROM labels WHERE name = ?");
                selectStmt.bind([labelName]);
                if (selectStmt.step()) {
                    labelId = selectStmt.get()[0];
                } else {
                    labelId = crypto.randomUUID();
                    db.run("INSERT INTO labels (id, name) VALUES (?, ?)", [labelId, labelName]);
                }
                selectStmt.free();

                db.run("INSERT INTO transaction_labels (transaction_id, label_id) VALUES (?, ?)", [transaction.id, labelId]);
            }
        }
        
        await addActivityLog(db, 'UPDATE', `Updated transaction: "${transaction.description}".`);

        db.run('COMMIT;');
    } catch (error) {
        console.error("[DB Write] FAILED to update transaction:", error);
        db.run('ROLLBACK;');
        throw error;
    }
};

export const deleteTransaction = async (db: any, transactionId: string): Promise<void> => {
    try {
        db.run('BEGIN TRANSACTION;');
        
        const stmt = db.prepare("SELECT description FROM transactions WHERE id = ?");
        stmt.bind([transactionId]);
        let description = 'Unknown Transaction';
        if (stmt.step()) {
            description = stmt.get()[0] as string;
        }
        stmt.free();

        const deleteStmt = db.prepare('DELETE FROM transactions WHERE id = ?');
        deleteStmt.bind([transactionId]);
        deleteStmt.step();
        deleteStmt.free();
        
        await addActivityLog(db, 'DELETE', `Deleted transaction: "${description}".`);
        
        db.run('COMMIT;');
    } catch (error) {
        console.error(`[DB Write] FAILED to delete transaction.`, error);
        db.run('ROLLBACK;');
        throw error;
    }
};

export const addMultipleTransactions = async (db: any, transactions: Omit<Transaction, 'id'>[]): Promise<void> => {
     try {
        db.run('BEGIN TRANSACTION;');
        
        const insertTxStmt = db.prepare('INSERT INTO transactions (id, description, amount, date, type, category, quantity, recurring_transaction_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        const selectLabelStmt = db.prepare("SELECT id FROM labels WHERE name = ?");
        const insertLabelStmt = db.prepare("INSERT INTO labels (id, name) VALUES (?, ?)");
        const insertJunctionStmt = db.prepare("INSERT INTO transaction_labels (transaction_id, label_id) VALUES (?, ?)");

        for (const transaction of transactions) {
            const newTransactionId = crypto.randomUUID();
            insertTxStmt.run([newTransactionId, transaction.description, transaction.amount, transaction.date, transaction.type, transaction.category, transaction.quantity, transaction.recurringTransactionId || null]);

            if (transaction.labels && transaction.labels.length > 0) {
                for (const labelName of transaction.labels) {
                    let labelId;
                    selectLabelStmt.bind([labelName]);
                    if (selectLabelStmt.step()) {
                        labelId = selectLabelStmt.get()[0];
                    } else {
                        labelId = crypto.randomUUID();
                        insertLabelStmt.run([labelId, labelName]);
                    }
                    selectLabelStmt.reset();
                    insertJunctionStmt.run([newTransactionId, labelId]);
                }
            }
        }
        
        insertTxStmt.free();
        selectLabelStmt.free();
        insertLabelStmt.free();
        insertJunctionStmt.free();

        db.run('COMMIT;');
    } catch (error) {
        console.error("[DB Write] FAILED to add multiple transactions:", error);
        db.run('ROLLBACK;');
        throw error;
    }
};

export const getTransactions = async (db: any): Promise<Transaction[]> => {
    const query = `
        SELECT
            t.id,
            t.description,
            t.amount,
            t.date,
            t.type,
            t.category,
            t.quantity,
            GROUP_CONCAT(l.name) as labels,
            t.recurring_transaction_id
        FROM transactions t
        LEFT JOIN transaction_labels tl ON t.id = tl.transaction_id
        LEFT JOIN labels l ON tl.label_id = l.id
        GROUP BY t.id
        ORDER BY t.date DESC, t.id DESC;
    `;
    const res = db.exec(query);
    if (res.length === 0) {
        return [];
    }
    
    const transactions: Transaction[] = res[0].values.map((row: any) => {
        const labelsString = row[7] as string | null;
        return {
            id: row[0],
            description: row[1],
            amount: row[2],
            date: row[3],
            type: row[4] as TransactionType,
            category: row[5],
            quantity: row[6],
            labels: labelsString ? labelsString.split(',') : [],
            recurringTransactionId: row[8],
        };
    });
    return transactions;
};

// ... existing budget functions ...

export const addCategoryBudget = async (db: any, budget: Omit<Budget, 'id'>): Promise<Budget> => {
    const newBudget: Budget = {
        ...budget,
        id: crypto.randomUUID(),
    };
    
    try {
        db.run('BEGIN TRANSACTION;');
        db.run(
            'INSERT INTO budgets (id, category, amount, month, year) VALUES (?, ?, ?, ?, ?)',
            [newBudget.id, newBudget.category, newBudget.amount, newBudget.month, newBudget.year]
        );
        await addActivityLog(db, 'CREATE', `Set budget for ${newBudget.category} to $${newBudget.amount.toFixed(2)}.`);
        db.run('COMMIT;');
        return newBudget;
    } catch (error) {
        console.error("[DB Write] FAILED to add category budget:", error);
        db.run('ROLLBACK;');
        throw error;
    }
};

export const addOrUpdateOverallBudget = async (db: any, budgetData: { amount: number; month: number; year: number }): Promise<Budget> => {
    try {
        db.run('BEGIN TRANSACTION;');

        const selectQuery = `SELECT id FROM budgets WHERE category = ? AND month = ? AND year = ?`;
        const selectParams = [OVERALL_BUDGET_CATEGORY, budgetData.month, budgetData.year];
        
        const stmt = db.prepare(selectQuery);
        stmt.bind(selectParams);
        let existingBudget: { id: string } | null = null;
        if (stmt.step()) {
            const result = stmt.getAsObject();
            existingBudget = { id: result.id as string };
        }
        stmt.free();

        const monthYearStr = new Date(budgetData.year, budgetData.month).toLocaleString('default', { month: 'long', year: 'numeric' });

        if (existingBudget) {
            const budgetId = existingBudget.id;
            const updateQuery = `UPDATE budgets SET amount = ? WHERE id = ?`;
            db.run(updateQuery, [budgetData.amount, budgetId]);
            await addActivityLog(db, 'UPDATE', `Updated overall budget for ${monthYearStr} to $${budgetData.amount.toFixed(2)}.`);
        } else {
            const insertQuery = `INSERT INTO budgets (id, category, amount, month, year) VALUES (?, ?, ?, ?, ?)`;
            const newId = crypto.randomUUID();
            db.run(insertQuery, [newId, OVERALL_BUDGET_CATEGORY, budgetData.amount, budgetData.month, budgetData.year]);
            await addActivityLog(db, 'CREATE', `Set overall budget for ${monthYearStr} to $${budgetData.amount.toFixed(2)}.`);
        }

        db.run('COMMIT;');

        const finalSelectStmt = db.prepare(`SELECT * FROM budgets WHERE category = ? AND month = ? AND year = ?`);
        finalSelectStmt.bind(selectParams);
        let finalBudgetResult: any = null;
        if (finalSelectStmt.step()) {
            finalBudgetResult = finalSelectStmt.getAsObject();
        }
        finalSelectStmt.free();

        if (!finalBudgetResult) {
            throw new Error("Could not retrieve the budget after upserting.");
        }
        
        const finalBudget: Budget = {
            id: finalBudgetResult.id,
            category: finalBudgetResult.category,
            amount: finalBudgetResult.amount,
            month: finalBudgetResult.month,
            year: finalBudgetResult.year,
        };
        
        return finalBudget;
    } catch (error) {
        console.error("[DB Write] FAILED to upsert overall budget. Rolling back.", error);
        db.run('ROLLBACK;');
        throw error;
    }
};

export const getBudgets = async (db: any): Promise<Budget[]> => {
    const res = db.exec("SELECT * FROM budgets ORDER BY category");
    if (res.length === 0) {
        return [];
    }
    
    const budgets: Budget[] = res[0].values.map((row: any) => {
        return {
            id: row[0],
            category: row[1],
            amount: row[2],
            month: row[3],
            year: row[4],
        };
    });
    return budgets;
};

// ... existing category functions ...

export const getCategories = async (db: any): Promise<Category[]> => {
    const res = db.exec("SELECT * FROM categories ORDER BY name");
    if (res.length === 0) {
        return [];
    }
    const categories: Category[] = res[0].values.map((row: any) => ({
        id: row[0],
        name: row[1],
        type: row[2] as TransactionType,
        isDefault: !!row[3],
    }));
    return categories;
};

export const addCategory = async (db: any, category: Omit<Category, 'id' | 'isDefault'>): Promise<Category> => {
    const newCategory: Category = {
        ...category,
        id: crypto.randomUUID(),
        isDefault: false,
    };
    
    try {
        db.run('BEGIN TRANSACTION;');
        db.run(
            'INSERT INTO categories (id, name, type, isDefault) VALUES (?, ?, ?, ?)',
            [newCategory.id, newCategory.name, newCategory.type, 0]
        );
        await addActivityLog(db, 'CREATE', `Created new ${newCategory.type.toLowerCase()} category: "${newCategory.name}".`);
        db.run('COMMIT;');
        return newCategory;
    } catch(error) {
        console.error("[DB Write] FAILED to add category:", error);
        db.run('ROLLBACK;');
        throw error;
    }
};

export const updateCategory = async (db: any, id: string, newName: string, oldName: string): Promise<void> => {
    try {
        db.run('BEGIN TRANSACTION;');
        db.run('UPDATE categories SET name = ? WHERE id = ?', [newName, id]);
        db.run('UPDATE transactions SET category = ? WHERE category = ?', [newName, oldName]);
        db.run('UPDATE budgets SET category = ? WHERE category = ?', [newName, oldName]);
        await addActivityLog(db, 'UPDATE', `Updated category "${oldName}" to "${newName}".`);
        db.run('COMMIT;');
    } catch(error) {
        console.error(`[DB Write] FAILED to update category. Rolling back.`, error);
        db.run('ROLLBACK;');
        throw error;
    }
};

export const deleteCategory = async (db: any, id: string): Promise<void> => {
    try {
        db.run('BEGIN TRANSACTION;');
        const stmt = db.prepare("SELECT name FROM categories WHERE id = ?");
        stmt.bind([id]);
        let categoryName = 'Unknown';
        if (stmt.step()) {
            categoryName = stmt.get()[0];
        }
        stmt.free();

        db.run('DELETE FROM categories WHERE id = ?', [id]);
        await addActivityLog(db, 'DELETE', `Deleted category "${categoryName}".`);
        db.run('COMMIT;');
    } catch(error) {
        console.error(`[DB Write] FAILED to delete category.`, error);
        db.run('ROLLBACK;');
        throw error;
    }
};

// --- RECURRING TRANSACTIONS ---

export const getRecurringTransactions = async (db: any): Promise<RecurringTransaction[]> => {
    const query = `
        SELECT
            r.id,
            r.description,
            r.amount,
            r.type,
            r.category,
            r.start_date,
            r.frequency,
            r.day_of_month,
            GROUP_CONCAT(l.name) as labels
        FROM recurring_transactions r
        LEFT JOIN recurring_transaction_labels rtl ON r.id = rtl.recurring_transaction_id
        LEFT JOIN labels l ON rtl.label_id = l.id
        GROUP BY r.id
        ORDER BY r.start_date DESC;
    `;
    const res = db.exec(query);
    if (res.length === 0) return [];

    return res[0].values.map((row: any) => ({
        id: row[0],
        description: row[1],
        amount: row[2],
        type: row[3],
        category: row[4],
        startDate: row[5],
        frequency: row[6],
        dayOfMonth: row[7],
        labels: row[8] ? (row[8] as string).split(',') : [],
    }));
};

export const addRecurringTransaction = async (db: any, rTx: Omit<RecurringTransaction, 'id'>): Promise<RecurringTransaction> => {
    const newRTx: RecurringTransaction = { ...rTx, id: crypto.randomUUID() };
    try {
        db.run('BEGIN TRANSACTION;');
        db.run('INSERT INTO recurring_transactions (id, description, amount, type, category, start_date, frequency, day_of_month) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
            newRTx.id, newRTx.description, newRTx.amount, newRTx.type, newRTx.category, newRTx.startDate, newRTx.frequency, newRTx.dayOfMonth
        ]);
        
        if (newRTx.labels && newRTx.labels.length > 0) {
            for (const labelName of newRTx.labels) {
                 let labelId;
                const selectStmt = db.prepare("SELECT id FROM labels WHERE name = ?");
                selectStmt.bind([labelName]);
                if (selectStmt.step()) {
                    labelId = selectStmt.get()[0];
                } else {
                    labelId = crypto.randomUUID();
                    db.run("INSERT INTO labels (id, name) VALUES (?, ?)", [labelId, labelName]);
                }
                selectStmt.free();
                db.run("INSERT INTO recurring_transaction_labels (recurring_transaction_id, label_id) VALUES (?, ?)", [newRTx.id, labelId]);
            }
        }
        await addActivityLog(db, 'CREATE', `Created recurring transaction: "${newRTx.description}".`);
        db.run('COMMIT;');
        return newRTx;
    } catch(e) {
        db.run('ROLLBACK;');
        console.error("[DB Write] FAILED to add recurring transaction:", e);
        throw e;
    }
};

export const deleteRecurringTransaction = async (db: any, id: string): Promise<void> => {
    try {
        db.run('BEGIN TRANSACTION;');
        const stmt = db.prepare("SELECT description FROM recurring_transactions WHERE id = ?");
        stmt.bind([id]);
        let description = 'Unknown Recurring Transaction';
        if (stmt.step()) {
            description = stmt.get()[0];
        }
        stmt.free();

        db.run('DELETE FROM recurring_transactions WHERE id = ?', [id]);
        await addActivityLog(db, 'DELETE', `Deleted recurring transaction: "${description}".`);
        db.run('COMMIT;');
    } catch(e) {
        console.error(`[DB Write] FAILED to delete recurring transaction.`, e);
        db.run('ROLLBACK;');
        throw e;
    }
}

export const generateDueRecurringTransactions = async (db: any) => {
    console.log("[DB] Checking for due recurring transactions...");
    const recurringTxs = await getRecurringTransactions(db);
    const today = new Date();
    today.setUTCHours(0,0,0,0);

    let generatedCount = 0;

    for (const rTx of recurringTxs) {
        const stmt = db.prepare('SELECT MAX(date) FROM transactions WHERE recurring_transaction_id = ?');
        stmt.bind([rTx.id]);
        const lastGeneratedDateStr = stmt.step() ? stmt.get()[0] : null;
        stmt.free();

        let cursorDate = new Date(lastGeneratedDateStr || rTx.startDate);
        if (lastGeneratedDateStr) {
             cursorDate.setUTCMonth(cursorDate.getUTCMonth() + 1);
        }
       
        while(cursorDate <= today) {
            const year = cursorDate.getUTCFullYear();
            const month = cursorDate.getUTCMonth();
            const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
            const day = Math.min(rTx.dayOfMonth, daysInMonth);
            const generationDate = new Date(Date.UTC(year, month, day));

            if (generationDate <= today && (!lastGeneratedDateStr || generationDate > new Date(lastGeneratedDateStr))) {
                 await addTransaction(db, {
                    description: rTx.description,
                    amount: rTx.amount,
                    date: generationDate.toISOString().split('T')[0],
                    type: rTx.type,
                    category: rTx.category,
                    quantity: 1,
                    labels: rTx.labels,
                    recurringTransactionId: rTx.id
                });
                generatedCount++;
            }
            cursorDate.setUTCMonth(cursorDate.getUTCMonth() + 1);
        }
    }
    if (generatedCount > 0) {
        console.log(`[DB] Generated ${generatedCount} new transaction(s) from recurring definitions.`);
    }
};

// --- SAVINGS ---

export const addOrUpdateSaving = async (db: any, savingData: { amount: number; month: number; year: number }): Promise<Saving> => {
    try {
        db.run('BEGIN TRANSACTION;');

        const selectQuery = `SELECT id FROM savings WHERE month = ? AND year = ?`;
        const selectParams = [savingData.month, savingData.year];
        
        const stmt = db.prepare(selectQuery);
        stmt.bind(selectParams);
        let existingSaving: { id: string } | null = null;
        if (stmt.step()) {
            const result = stmt.getAsObject();
            existingSaving = { id: result.id as string };
        }
        stmt.free();

        const monthYearStr = new Date(savingData.year, savingData.month).toLocaleString('default', { month: 'long', year: 'numeric' });

        if (existingSaving) {
            const savingId = existingSaving.id;
            const updateQuery = `UPDATE savings SET amount = ? WHERE id = ?`;
            db.run(updateQuery, [savingData.amount, savingId]);
            await addActivityLog(db, 'UPDATE', `Updated savings for ${monthYearStr} to $${savingData.amount.toFixed(2)}.`);
        } else {
            const insertQuery = `INSERT INTO savings (id, amount, month, year) VALUES (?, ?, ?, ?)`;
            const newId = crypto.randomUUID();
            db.run(insertQuery, [newId, savingData.amount, savingData.month, savingData.year]);
            await addActivityLog(db, 'CREATE', `Set savings for ${monthYearStr} to $${savingData.amount.toFixed(2)}.`);
        }

        db.run('COMMIT;');

        const finalSelectStmt = db.prepare(`SELECT * FROM savings WHERE month = ? AND year = ?`);
        finalSelectStmt.bind(selectParams);
        let finalSavingResult: any = null;
        if (finalSelectStmt.step()) {
            finalSavingResult = finalSelectStmt.getAsObject();
        }
        finalSelectStmt.free();

        if (!finalSavingResult) {
            throw new Error("Could not retrieve the saving after upserting.");
        }
        
        const finalSaving: Saving = {
            id: finalSavingResult.id,
            amount: finalSavingResult.amount,
            month: finalSavingResult.month,
            year: finalSavingResult.year,
        };
        
        return finalSaving;
    } catch (error) {
        console.error("[DB Write] FAILED to upsert saving. Rolling back.", error);
        db.run('ROLLBACK;');
        throw error;
    }
};

export const getSavings = async (db: any): Promise<Saving[]> => {
    const res = db.exec("SELECT * FROM savings ORDER BY year, month");
    if (res.length === 0) {
        return [];
    }
    
    const savings: Saving[] = res[0].values.map((row: any) => {
        return {
            id: row[0],
            amount: row[1],
            month: row[2],
            year: row[3],
        };
    });
    return savings;
};

// --- ACTIVITY LOG ---

export const addActivityLog = async (db: any, action: string, description: string): Promise<void> => {
    const timestamp = new Date().toISOString();
    const id = crypto.randomUUID();
    try {
        db.run(
            'INSERT INTO activity_log (id, timestamp, action, description) VALUES (?, ?, ?, ?)',
            [id, timestamp, action, description]
        );
    } catch (error) {
        console.error("[DB Write] FAILED to add activity log:", error);
        // Don't throw, logging failure shouldn't break the main action
    }
};

export const getActivityLog = async (db: any): Promise<ActivityLog[]> => {
    const res = db.exec("SELECT id, timestamp, action, description FROM activity_log ORDER BY timestamp DESC");
    if (res.length === 0) {
        return [];
    }
    
    const logs: ActivityLog[] = res[0].values.map((row: any) => {
        return {
            id: row[0],
            timestamp: row[1],
            action: row[2],
            description: row[3],
        };
    });
    return logs;
};