# 🏦 বাংলাদেশ শিক্ষা প্রতিষ্ঠান অ্যাকাউন্টিং সিস্টেম
# Advanced Accounting Module for Educational Institutions in Bangladesh

## 📋 সিস্টেম ওভারভিউ (System Overview)

এই অ্যাকাউন্টিং সিস্টেম বাংলাদেশের শিক্ষা প্রতিষ্ঠানের জন্য বিশেষভাবে ডিজাইন করা হয়েছে। এটি সম্পূর্ণ ডাবল এন্ট্রি অ্যাকাউন্টিং সিস্টেম অনুসরণ করে এবং বাংলাদেশের অর্থবছর (জুলাই-জুন) অনুযায়ী কাজ করে।

### 🎯 প্রধান ফিচার (Key Features):
- 💰 ফি ম্যানেজমেন্ট (Fee Management)
- 📊 ডাবল এন্ট্রি বুকিপিং (Double Entry Bookkeeping)  
- 🏦 ব্যাংক রেকনসিলিয়েশন (Bank Reconciliation)
- 📈 রিয়েল-টাইম ড্যাশবোর্ড (Real-time Dashboard)
- 💸 খরচ ট্র্যাকিং (Expense Tracking)
- 📄 অটোমেটিক রিপোর্ট জেনারেশন
- 📱 মোবাইল পেমেন্ট সাপোর্ট (bKash, Nagad, Rocket)

## 🗃️ ডেটাবেস টেবিল স্ট্রাকচার (Database Tables)

### 1. **acc_chart_of_accounts** - অ্যাকাউন্ট চার্ট
সকল অ্যাকাউন্টের তালিকা (Assets, Liabilities, Income, Expense)
```sql
- account_id (Primary Key)
- account_code (Unique: 1001, 2001, etc.)
- account_name (English name)
- account_name_bn (Bengali name)
- account_type (ASSET, LIABILITY, EQUITY, INCOME, EXPENSE)
- account_category (Current Asset, Fixed Asset, etc.)
- parent_account_id (For sub-accounts)
```

### 2. **acc_transactions** - প্রধান লেনদেন খাতা
সকল আর্থিক লেনদেনের প্রধান রেকর্ড
```sql
- transaction_id (Primary Key)
- transaction_date, reference_no
- transaction_type (INCOME, EXPENSE, TRANSFER)
- description (Bengali/English)
- total_amount, campus, student_id
- payment_method (CASH, BANK, BKASH, NAGAD)
- approval_status (PENDING, APPROVED, REJECTED)
```

### 3. **acc_transaction_details** - লেনদেনের বিস্তারিত (Double Entry)
প্রতিটি লেনদেনের ডেবিট/ক্রেডিট এন্ট্রি
```sql
- detail_id, transaction_id, account_id
- debit_amount, credit_amount
- description
```

### 4. **acc_fee_structure** - ফি স্ট্রাকচার
বিভিন্ন ধরনের ফি এবং তাদের পরিমাণ
```sql
- fee_id, fee_code, fee_name, fee_name_bn
- fee_type (TUITION, EXAM, ADMISSION, TRANSPORT)
- amount, class_level, due_date_days
- late_fee_amount, late_fee_percentage
```

### 5. **acc_student_bills** - ছাত্র ফি বিল
ছাত্রদের মাসিক/সাময়িক বিল
```sql
- bill_id, bill_number, student_id, student_name
- bill_date, due_date, total_amount
- paid_amount, outstanding_amount
- status (PENDING, PARTIAL, PAID, OVERDUE)
- academic_year, bill_month
```

### 6. **acc_fee_collections** - ফি আদায়
ফি পেমেন্ট রেকর্ড
```sql
- collection_id, receipt_number, student_id
- collection_date, total_amount
- payment_method, payment_details (JSON)
- collected_by, transaction_id (link to general ledger)
```

### 7. **acc_expenses** - খরচ
প্রতিষ্ঠানের সকল খরচের রেকর্ড
```sql
- expense_id, voucher_number, expense_date
- expense_category (SALARY, UTILITIES, MAINTENANCE)
- description, total_amount, vendor_name
- payment_method, approval_status
```

### 8. **acc_bank_accounts** - ব্যাংক অ্যাকাউন্ট
প্রতিষ্ঠানের ব্যাংক অ্যাকাউন্ট তথ্য
```sql
- bank_account_id, account_name, account_number
- bank_name, branch_name, current_balance
- opening_balance, opening_date
```

### 9. **acc_bank_reconciliation** - ব্যাংক রেকনসিলিয়েশন
ব্যাংক স্টেটমেন্ট মিলানোর রেকর্ড
```sql
- reconciliation_id, bank_account_id
- statement_date, book_balance, bank_balance
- differences, status, reconciled_by
```

### 10. **acc_budget** - বাজেট পরিকল্পনা
বার্ষিক বাজেট পরিকল্পনা এবং ভ্যারিয়েন্স অ্যানালাইসিস
```sql
- budget_id, budget_name, budget_year
- account_id, budgeted_amount, actual_amount
- variance_amount, campus
```

## 📊 ড্যাশবোর্ড ফিচারসমূহ (Dashboard Features)

### 🎯 KPI ইন্ডিকেটর:
- **আজকের আয়**: দৈনিক ইনকাম ট্র্যাকিং
- **মাসিক আয়**: মাসিক ইনকাম এবং গ্রোথ রেট
- **বকেয়া পাওনা**: Outstanding receivables
- **ব্যাংক ব্যালেন্স**: সকল অ্যাকাউন্টের মোট ব্যালেন্স

### 📈 চার্ট এবং গ্রাফ:
- **আয়-ব্যয় ট্রেন্ড**: মাসিক তুলনামূলক চার্ট
- **আয়ের উৎস**: পাই চার্ট (টিউশন, পরীক্ষা, অন্যান্য ফি)
- **পেমেন্ট মেথড**: নগদ, ব্যাংক, মোবাইল ব্যাংকিং

### 📋 রিয়েল-টাইম টেবিল:
- **সাম্প্রতিক লেনদেন**: সর্বশেষ transactions
- **বকেয়া ফি তালিকা**: Outstanding student fees
- **আজকের কালেকশন**: Daily collections

### ⚡ কুইক অ্যাকশন:
- ফি আদায় (Fee Collection)
- খরচ এন্ট্রি (Expense Entry)
- ব্যাংক রেকনসিলিয়েশন
- বিল তৈরি (Invoice Generation)
- রিপোর্ট জেনারেশন

## 🔧 ইনস্টলেশন গাইড (Installation Guide)

### 1. ডেটাবেস সেটআপ:
```sql
-- Supabase/PostgreSQL এ database_schema.sql ফাইল রান করুন
-- এটি সব টেবিল, ইনডেক্স, ভিউ এবং ট্রিগার তৈরি করবে
```

### 2. ডিফল্ট ডেটা:
স্কিমা ফাইলে ইতিমধ্যে নিম্নলিখিত ডিফল্ট ডেটা অন্তর্ভুক্ত:
- Chart of Accounts (12টি বেসিক অ্যাকাউন্ট)
- Financial Year (2024-25)
- Sample Fee Structure (টিউশন, পরীক্ষা, ভর্তি ফি)

### 3. কনফিগারেশন:
`accounting_dashboard.html` ফাইলে:
- Supabase URL এবং API Key আপডেট করুন
- Allowed editors তালিকায় authorized users যোগ করুন

## 📱 মোবাইল পেমেন্ট ইন্টিগ্রেশন

সিস্টেম নিম্নলিখিত বাংলাদেশী পেমেন্ট গেটওয়ে সাপোর্ট করে:
- **bKash** - JSON format: `{"trx_id": "TXN123", "phone": "01711123456"}`
- **Nagad** - JSON format: `{"payment_ref": "NAG456", "account": "01811123456"}`
- **Rocket** - JSON format: `{"transaction_id": "RKT789", "wallet": "01911123456"}`

## 🔍 রিপোর্টিং সিস্টেম

### প্রি-বিল্ট ভিউ (Pre-built Views):
1. **v_daily_income**: দৈনিক আয়ের সামারি
2. **v_monthly_summary**: মাসিক আয়-ব্যয় তুলনা
3. **v_outstanding_summary**: বকেয়া ফি সামারি

### কাস্টম রিপোর্ট:
- Trial Balance
- Profit & Loss Statement
- Balance Sheet
- Cash Flow Statement
- Fee Collection Report
- Outstanding Fees Report

## 🔐 নিরাপত্তা ও অনুমতি (Security & Permissions)

### অ্যাক্সেস কন্ট্রোল:
- **Admin**: সব ধরনের লেনদেন এবং রিপোর্ট
- **Accountant**: আর্থিক লেনদেন এবং রিপোর্ট
- **Cashier**: ফি কালেকশন এবং রিসিপ্ট
- **View Only**: শুধুমাত্র রিপোর্ট দেখা

### ডেটা ভ্যালিডেশন:
- Double Entry validation (Debit = Credit)
- Date range validation
- Amount limits
- Approval workflow

## 🚀 পারফরমেন্স অপটিমাইজেশন

### ইনডেক্সিং:
- Transaction date এবং type এর উপর ইনডেক্স
- Student ID এবং status এর উপর ইনডেক্স
- Foreign key relationships

### ক্যাশিং:
- Dashboard KPIs (5 মিনিট ক্যাশ)
- Chart data (10 মিনিট ক্যাশ)
- Static lookups (অ্যাকাউন্ট চার্ট, ফি স্ট্রাকচার)

## 📞 সাপোর্ট ও কমিউনিটি

এই সিস্টেম ওপেন সোর্স এবং বাংলাদেশী শিক্ষা প্রতিষ্ঠানের চাহিদা মাথায় রেখে তৈরি। যেকোনো সমস্যা বা পরামর্শের জন্য GitHub repository তে issue তৈরি করুন।

### প্রয়োজনীয় সফটওয়্যার:
- PostgreSQL/Supabase (Database)
- Modern Web Browser
- Chart.js (Included via CDN)

---
**© 2024 বাংলাদেশ শিক্ষা প্রতিষ্ঠান অ্যাকাউন্টিং সিস্টেম - সকল অধিকার সংরক্ষিত**