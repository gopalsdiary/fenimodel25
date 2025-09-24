-- =================================================================
-- বাংলাদেশ শিক্ষা প্রতিষ্ঠান অ্যাকাউন্টিং সিস্টেম - ডেটাবেস স্কিমা
-- Advanced Accounting Module Database Schema for Bangladesh Education
-- =================================================================

-- 1. Chart of Accounts (অ্যাকাউন্ট চার্ট)
CREATE TABLE acc_chart_of_accounts (
    account_id BIGSERIAL PRIMARY KEY,
    account_code VARCHAR(20) UNIQUE NOT NULL, -- 1001, 2001, etc.
    account_name VARCHAR(100) NOT NULL, -- "Cash in Hand", "Tuition Fee Income"
    account_name_bn VARCHAR(150), -- বাংলা নাম
    account_type VARCHAR(20) NOT NULL, -- ASSET, LIABILITY, EQUITY, INCOME, EXPENSE
    account_category VARCHAR(50), -- Current Asset, Fixed Asset, etc.
    parent_account_id BIGINT REFERENCES acc_chart_of_accounts(account_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Main Transactions Ledger (প্রধান লেনদেন খাতা)
CREATE TABLE acc_transactions (
    transaction_id BIGSERIAL PRIMARY KEY,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    transaction_time TIME WITH TIME ZONE DEFAULT NOW(),
    reference_no VARCHAR(50) UNIQUE, -- Receipt/Voucher number
    transaction_type VARCHAR(20) NOT NULL, -- INCOME, EXPENSE, TRANSFER
    description TEXT NOT NULL,
    description_bn TEXT, -- বাংলা বিবরণ
    total_amount DECIMAL(12,2) NOT NULL,
    campus VARCHAR(50) DEFAULT 'main',
    student_id VARCHAR(20), -- Link to student if applicable
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    approval_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    payment_method VARCHAR(30), -- CASH, BANK, BKASH, NAGAD, ROCKET
    payment_details JSONB, -- Bank details, mobile wallet info, etc.
    is_reversed BOOLEAN DEFAULT false,
    reversed_by VARCHAR(100),
    reversed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Transaction Details (Double Entry) - লেনদেনের বিস্তারিত
CREATE TABLE acc_transaction_details (
    detail_id BIGSERIAL PRIMARY KEY,
    transaction_id BIGINT NOT NULL REFERENCES acc_transactions(transaction_id) ON DELETE CASCADE,
    account_id BIGINT NOT NULL REFERENCES acc_chart_of_accounts(account_id),
    debit_amount DECIMAL(12,2) DEFAULT 0,
    credit_amount DECIMAL(12,2) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Fee Structure (ফি স্ট্রাকচার)
CREATE TABLE acc_fee_structure (
    fee_id BIGSERIAL PRIMARY KEY,
    fee_code VARCHAR(20) UNIQUE NOT NULL,
    fee_name VARCHAR(100) NOT NULL,
    fee_name_bn VARCHAR(150),
    fee_type VARCHAR(30) NOT NULL, -- TUITION, EXAM, ADMISSION, TRANSPORT, etc.
    amount DECIMAL(10,2) NOT NULL,
    class_level VARCHAR(20), -- Class 1-12, or specific classes
    applicable_from DATE NOT NULL,
    applicable_to DATE,
    is_mandatory BOOLEAN DEFAULT true,
    due_date_days INTEGER DEFAULT 30, -- Days after bill generation
    late_fee_amount DECIMAL(10,2) DEFAULT 0,
    late_fee_percentage DECIMAL(5,2) DEFAULT 0,
    account_id BIGINT REFERENCES acc_chart_of_accounts(account_id), -- Income account
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Student Fee Bills (ছাত্র ফি বিল)
CREATE TABLE acc_student_bills (
    bill_id BIGSERIAL PRIMARY KEY,
    bill_number VARCHAR(30) UNIQUE NOT NULL,
    student_id VARCHAR(20) NOT NULL,
    student_name VARCHAR(100),
    class_section VARCHAR(20),
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    outstanding_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, PARTIAL, PAID, OVERDUE
    campus VARCHAR(50) DEFAULT 'main',
    academic_year VARCHAR(10), -- 2024-25
    bill_month VARCHAR(20), -- January, February, etc.
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Student Bill Details (ছাত্র বিল বিস্তারিত)
CREATE TABLE acc_student_bill_details (
    detail_id BIGSERIAL PRIMARY KEY,
    bill_id BIGINT NOT NULL REFERENCES acc_student_bills(bill_id) ON DELETE CASCADE,
    fee_id BIGINT NOT NULL REFERENCES acc_fee_structure(fee_id),
    fee_name VARCHAR(100),
    quantity INTEGER DEFAULT 1,
    unit_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2)
);

-- 7. Fee Collections/Payments (ফি আদায়)
CREATE TABLE acc_fee_collections (
    collection_id BIGSERIAL PRIMARY KEY,
    receipt_number VARCHAR(30) UNIQUE NOT NULL,
    student_id VARCHAR(20) NOT NULL,
    student_name VARCHAR(100),
    collection_date DATE NOT NULL DEFAULT CURRENT_DATE,
    collection_time TIME WITH TIME ZONE DEFAULT NOW(),
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL, -- CASH, BANK, BKASH, NAGAD, etc.
    payment_details JSONB, -- Transaction ID, bank details, etc.
    collected_by VARCHAR(100),
    campus VARCHAR(50) DEFAULT 'main',
    academic_year VARCHAR(10),
    notes TEXT,
    transaction_id BIGINT REFERENCES acc_transactions(transaction_id), -- Link to general ledger
    is_cancelled BOOLEAN DEFAULT false,
    cancelled_by VARCHAR(100),
    cancelled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Fee Collection Details
CREATE TABLE acc_fee_collection_details (
    detail_id BIGSERIAL PRIMARY KEY,
    collection_id BIGINT NOT NULL REFERENCES acc_fee_collections(collection_id) ON DELETE CASCADE,
    bill_id BIGINT REFERENCES acc_student_bills(bill_id),
    fee_type VARCHAR(50),
    amount_collected DECIMAL(10,2) NOT NULL,
    notes TEXT
);

-- 9. Expenses (খরচ)
CREATE TABLE acc_expenses (
    expense_id BIGSERIAL PRIMARY KEY,
    voucher_number VARCHAR(30) UNIQUE NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expense_category VARCHAR(50) NOT NULL, -- SALARY, UTILITIES, MAINTENANCE, etc.
    description TEXT NOT NULL,
    description_bn TEXT,
    total_amount DECIMAL(12,2) NOT NULL,
    vendor_name VARCHAR(100),
    vendor_contact VARCHAR(50),
    payment_method VARCHAR(30),
    payment_details JSONB,
    approved_by VARCHAR(100),
    approval_status VARCHAR(20) DEFAULT 'PENDING',
    campus VARCHAR(50) DEFAULT 'main',
    account_id BIGINT REFERENCES acc_chart_of_accounts(account_id), -- Expense account
    transaction_id BIGINT REFERENCES acc_transactions(transaction_id),
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Bank Accounts (ব্যাংক অ্যাকাউন্ট)
CREATE TABLE acc_bank_accounts (
    bank_account_id BIGSERIAL PRIMARY KEY,
    account_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(30) UNIQUE NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    branch_name VARCHAR(100),
    account_type VARCHAR(20), -- CHECKING, SAVINGS
    current_balance DECIMAL(12,2) DEFAULT 0,
    opening_balance DECIMAL(12,2) DEFAULT 0,
    opening_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    account_id BIGINT REFERENCES acc_chart_of_accounts(account_id), -- Link to COA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Bank Reconciliation (ব্যাংক রেকনসিলিয়েশন)
CREATE TABLE acc_bank_reconciliation (
    reconciliation_id BIGSERIAL PRIMARY KEY,
    bank_account_id BIGINT NOT NULL REFERENCES acc_bank_accounts(bank_account_id),
    statement_date DATE NOT NULL,
    book_balance DECIMAL(12,2) NOT NULL,
    bank_balance DECIMAL(12,2) NOT NULL,
    reconciled_balance DECIMAL(12,2),
    differences DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, RECONCILED, REVIEWED
    reconciled_by VARCHAR(100),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Budget Planning (বাজেট পরিকল্পনা)
CREATE TABLE acc_budget (
    budget_id BIGSERIAL PRIMARY KEY,
    budget_name VARCHAR(100) NOT NULL,
    budget_year VARCHAR(10) NOT NULL, -- 2024-25
    account_id BIGINT NOT NULL REFERENCES acc_chart_of_accounts(account_id),
    budgeted_amount DECIMAL(12,2) NOT NULL,
    actual_amount DECIMAL(12,2) DEFAULT 0,
    variance_amount DECIMAL(12,2) DEFAULT 0,
    campus VARCHAR(50) DEFAULT 'main',
    created_by VARCHAR(100),
    approved_by VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Financial Year Settings (অর্থবছর সেটিংস)
CREATE TABLE acc_financial_years (
    fy_id BIGSERIAL PRIMARY KEY,
    year_name VARCHAR(10) UNIQUE NOT NULL, -- 2024-25
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_closed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Daily Cash Book (দৈনিক ক্যাশ বই)
CREATE TABLE acc_daily_cashbook (
    cashbook_id BIGSERIAL PRIMARY KEY,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    opening_balance DECIMAL(10,2) DEFAULT 0,
    total_receipts DECIMAL(10,2) DEFAULT 0,
    total_payments DECIMAL(10,2) DEFAULT 0,
    closing_balance DECIMAL(10,2) DEFAULT 0,
    campus VARCHAR(50) DEFAULT 'main',
    prepared_by VARCHAR(100),
    verified_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =================================================================
-- INDEXES for Better Performance
-- =================================================================

CREATE INDEX idx_acc_transactions_date ON acc_transactions(transaction_date);
CREATE INDEX idx_acc_transactions_type ON acc_transactions(transaction_type);
CREATE INDEX idx_acc_transactions_student ON acc_transactions(student_id);
CREATE INDEX idx_acc_student_bills_student ON acc_student_bills(student_id);
CREATE INDEX idx_acc_student_bills_status ON acc_student_bills(status);
CREATE INDEX idx_acc_fee_collections_student ON acc_fee_collections(student_id);
CREATE INDEX idx_acc_fee_collections_date ON acc_fee_collections(collection_date);

-- =================================================================
-- TRIGGERS for Automatic Updates
-- =================================================================

-- Update outstanding amount when payment is made
CREATE OR REPLACE FUNCTION update_bill_outstanding()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE acc_student_bills 
    SET 
        paid_amount = COALESCE((
            SELECT SUM(amount_collected) 
            FROM acc_fee_collection_details fcd
            JOIN acc_fee_collections fc ON fc.collection_id = fcd.collection_id
            WHERE fcd.bill_id = NEW.bill_id AND fc.is_cancelled = false
        ), 0),
        updated_at = NOW()
    WHERE bill_id = NEW.bill_id;
    
    UPDATE acc_student_bills 
    SET 
        outstanding_amount = total_amount - paid_amount,
        status = CASE 
            WHEN paid_amount = 0 THEN 'PENDING'
            WHEN paid_amount >= total_amount THEN 'PAID'
            ELSE 'PARTIAL'
        END
    WHERE bill_id = NEW.bill_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bill_outstanding
    AFTER INSERT OR UPDATE ON acc_fee_collection_details
    FOR EACH ROW
    EXECUTE FUNCTION update_bill_outstanding();

-- =================================================================
-- DEFAULT DATA INSERTION
-- =================================================================

-- Insert default Chart of Accounts
INSERT INTO acc_chart_of_accounts (account_code, account_name, account_name_bn, account_type, account_category) VALUES
('1001', 'Cash in Hand', 'হাতের নগদ', 'ASSET', 'Current Asset'),
('1002', 'Bank Account', 'ব্যাংক অ্যাকাউন্ট', 'ASSET', 'Current Asset'),
('1003', 'Accounts Receivable', 'প্রাপ্য হিসাব', 'ASSET', 'Current Asset'),
('1101', 'Furniture & Fixtures', 'আসবাবপত্র', 'ASSET', 'Fixed Asset'),
('2001', 'Accounts Payable', 'দেয় হিসাব', 'LIABILITY', 'Current Liability'),
('3001', 'Capital', 'মূলধন', 'EQUITY', 'Owner Equity'),
('4001', 'Tuition Fee Income', 'টিউশন ফি আয়', 'INCOME', 'Operating Income'),
('4002', 'Exam Fee Income', 'পরীক্ষা ফি আয়', 'INCOME', 'Operating Income'),
('4003', 'Admission Fee Income', 'ভর্তি ফি আয়', 'INCOME', 'Operating Income'),
('5001', 'Teacher Salary', 'শিক্ষক বেতন', 'EXPENSE', 'Operating Expense'),
('5002', 'Utility Expenses', 'ইউটিলিটি খরচ', 'EXPENSE', 'Operating Expense'),
('5003', 'Maintenance Expenses', 'রক্ষণাবেক্ষণ খরচ', 'EXPENSE', 'Operating Expense');

-- Insert default Financial Year
INSERT INTO acc_financial_years (year_name, start_date, end_date, is_current) VALUES
('2024-25', '2024-07-01', '2025-06-30', true);

-- Insert default Fee Structure
INSERT INTO acc_fee_structure (fee_code, fee_name, fee_name_bn, fee_type, amount, class_level, applicable_from, account_id) VALUES
('TF001', 'Monthly Tuition Fee', 'মাসিক টিউশন ফি', 'TUITION', 5000, 'Class-10', '2024-07-01', 4),
('EF001', 'Exam Fee', 'পরীক্ষা ফি', 'EXAM', 2000, 'Class-10', '2024-07-01', 5),
('AF001', 'Admission Fee', 'ভর্তি ফি', 'ADMISSION', 15000, 'Class-10', '2024-07-01', 6);

-- =================================================================
-- HELPFUL VIEWS for Dashboard
-- =================================================================

-- Daily Income Summary
CREATE VIEW v_daily_income AS
SELECT 
    transaction_date,
    campus,
    SUM(total_amount) as daily_income,
    COUNT(*) as transaction_count
FROM acc_transactions 
WHERE transaction_type = 'INCOME' AND approval_status = 'APPROVED'
GROUP BY transaction_date, campus
ORDER BY transaction_date DESC;

-- Monthly Income vs Expense
CREATE VIEW v_monthly_summary AS
SELECT 
    EXTRACT(YEAR FROM transaction_date) as year,
    EXTRACT(MONTH FROM transaction_date) as month,
    campus,
    SUM(CASE WHEN transaction_type = 'INCOME' THEN total_amount ELSE 0 END) as total_income,
    SUM(CASE WHEN transaction_type = 'EXPENSE' THEN total_amount ELSE 0 END) as total_expense,
    SUM(CASE WHEN transaction_type = 'INCOME' THEN total_amount ELSE -total_amount END) as net_income
FROM acc_transactions 
WHERE approval_status = 'APPROVED'
GROUP BY EXTRACT(YEAR FROM transaction_date), EXTRACT(MONTH FROM transaction_date), campus;

-- Outstanding Fees Summary
CREATE VIEW v_outstanding_summary AS
SELECT 
    sb.student_id,
    sb.student_name,
    sb.class_section,
    SUM(sb.outstanding_amount) as total_outstanding,
    MIN(sb.due_date) as earliest_due_date,
    COUNT(*) as pending_bills
FROM acc_student_bills sb
WHERE sb.status IN ('PENDING', 'PARTIAL', 'OVERDUE')
GROUP BY sb.student_id, sb.student_name, sb.class_section;

-- =================================================================
-- END OF SCHEMA
-- =================================================================