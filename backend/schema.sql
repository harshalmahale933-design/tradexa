-- ============================================
-- TRADEXA DATABASE SCHEMA - PHASE 1
-- ============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_name VARCHAR(100) NOT NULL,
    account_type VARCHAR(20) NOT NULL,
    starting_balance NUMERIC(15,2) DEFAULT 0,
    current_balance NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    trade_date DATE NOT NULL,
    asset VARCHAR(50) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    entry_price NUMERIC(18,6) NOT NULL,
    stop_loss NUMERIC(18,6) NOT NULL,
    take_profit NUMERIC(18,6) NOT NULL,
    exit_price NUMERIC(18,6),
    position_size NUMERIC(18,6) NOT NULL,
    risk_amount NUMERIC(15,2) NOT NULL,
    planned_rr NUMERIC(6,2),
    realized_rr NUMERIC(6,2),
    trade_result VARCHAR(15),
    pl_amount NUMERIC(15,2),
    pl_percentage NUMERIC(8,4),
    screenshot_url TEXT,
    execution_rating INT CHECK (execution_rating BETWEEN 1 AND 5),
    strategy VARCHAR(100),
    setup VARCHAR(100),
    emotion VARCHAR(50),
    mistake_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_account_id ON trades(account_id);
CREATE INDEX idx_trades_date ON trades(trade_date);