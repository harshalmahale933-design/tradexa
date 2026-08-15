"""
Tradexa Backend - Phase 1 (Postgres-connected)
====================================
Covers: Auth, Trade Journal, Dashboard, Personal & Community Performance, Calendar
Run: uvicorn app.main:app --reload
"""
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from collections import defaultdict
import hashlib
import jwt
from sqlalchemy import text

from app.database import engine
from app.trade_calculations import calculate_trade_result, Direction
from app.market_intelligence import (
    get_asset_technical_analysis,
    get_time_series,
    calculate_technical_score,
    ASSET_SYMBOLS,
)

from app.tradexa_intelligence import (
    get_tradexa_intelligence,
)
import os

app = FastAPI(title="Tradexa API - Phase 1")

# Comma-separated list of allowed frontend origins, e.g.
# "http://localhost:5173,https://tradexa-frontend.onrender.com"
_allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [origin.strip() for origin in _allowed_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = os.getenv("SECRET_KEY", "change-this-in-production")
if SECRET_KEY == "change-this-in-production":
    print("WARNING: SECRET_KEY is not set via environment variable. Set it in production!")


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@app.post("/auth/register")
def register(payload: RegisterRequest):
    with engine.begin() as conn:
        existing = conn.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": payload.email}
        ).fetchone()

        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")

        user_result = conn.execute(
            text("""
                INSERT INTO users (name, email, password_hash)
                VALUES (:name, :email, :password_hash)
                RETURNING id
            """),
            {"name": payload.name, "email": payload.email, "password_hash": hash_password(payload.password)}
        )
        user_id = user_result.fetchone()[0]

        account_result = conn.execute(
            text("""
                INSERT INTO accounts (user_id, account_name, account_type, starting_balance, current_balance)
                VALUES (:user_id, 'Personal', 'personal', 0, 0)
                RETURNING id
            """),
            {"user_id": user_id}
        )
        account_id = account_result.fetchone()[0]

    return {"message": "Registered successfully", "user_id": str(user_id), "account_id": str(account_id)}


@app.post("/auth/login")
def login(payload: LoginRequest):
    with engine.connect() as conn:
        user = conn.execute(
            text("SELECT id, name, email, password_hash FROM users WHERE email = :email"),
            {"email": payload.email}
        ).fetchone()

        if not user or user.password_hash != hash_password(payload.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        account = conn.execute(
            text("SELECT id FROM accounts WHERE user_id = :user_id LIMIT 1"),
            {"user_id": user.id}
        ).fetchone()

    token = jwt.encode({"user_id": str(user.id), "email": user.email}, SECRET_KEY, algorithm="HS256")
    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "name": user.name,
            "email": user.email,
            "account_id": str(account.id) if account else None,
        }
    }


class TradeCreate(BaseModel):
    account_id: str
    trade_date: date
    asset: str
    direction: Direction
    entry_price: float
    stop_loss: float
    take_profit: float
    position_size: float
    risk_amount: float

    trading_session: Optional[str] = None
    strategy: Optional[str] = None
    setup: Optional[str] = None
    emotion: Optional[str] = None

    setup_tags: Optional[str] = None
    mistake_tags: Optional[str] = None
    trade_notes: Optional[str] = None

class TradeExitRequest(BaseModel):
    exit_price: float
    execution_rating: Optional[int] = None
    mistake_notes: Optional[str] = None


@app.post("/trades")
def create_trade(payload: TradeCreate):
    with engine.begin() as conn:

        # Verify account exists
        account = conn.execute(
            text("""
                SELECT id, user_id
                FROM accounts
                WHERE id = :account_id
            """),
            {
                "account_id": payload.account_id
            }
        ).fetchone()

        if not account:
            raise HTTPException(
                status_code=404,
                detail="Account not found"
            )

        # Insert trade
        result = conn.execute(
            text("""
                INSERT INTO trades (
                    user_id,
                    account_id,
                    trade_date,
                    asset,
                    direction,
                    entry_price,
                    stop_loss,
                    take_profit,
                    position_size,
                    risk_amount,
                    trading_session,
                    strategy,
                    setup,
                    emotion,
                    setup_tags,
                    mistake_tags,
                    trade_notes
                )
                VALUES (
                    :user_id,
                    :account_id,
                    :trade_date,
                    :asset,
                    :direction,
                    :entry_price,
                    :stop_loss,
                    :take_profit,
                    :position_size,
                    :risk_amount,
                    :trading_session,
                    :strategy,
                    :setup,
                    :emotion,
                    :setup_tags,
                    :mistake_tags,
                    :trade_notes
                )
                RETURNING id, created_at
            """),
            {
                "user_id": account.user_id,
                "account_id": payload.account_id,
                "trade_date": payload.trade_date,
                "asset": payload.asset,
                "direction": payload.direction.value,
                "entry_price": payload.entry_price,
                "stop_loss": payload.stop_loss,
                "take_profit": payload.take_profit,
                "position_size": payload.position_size,
                "risk_amount": payload.risk_amount,
                "trading_session": payload.trading_session,
                "strategy": payload.strategy,
                "setup": payload.setup,
                "emotion": payload.emotion,
                "setup_tags": payload.setup_tags,
                "mistake_tags": payload.mistake_tags,
                "trade_notes": payload.trade_notes,
            }
        )

        row = result.fetchone()

    return {
        "id": str(row.id),
        "account_id": payload.account_id,
        "trade_date": str(payload.trade_date),
        "asset": payload.asset,
        "direction": payload.direction.value,
        "entry_price": payload.entry_price,
        "stop_loss": payload.stop_loss,
        "take_profit": payload.take_profit,
        "position_size": payload.position_size,
        "risk_amount": payload.risk_amount,
        "trading_session": payload.trading_session,
        "strategy": payload.strategy,
        "setup": payload.setup,
        "emotion": payload.emotion,
        "setup_tags": payload.setup_tags,
        "mistake_tags": payload.mistake_tags,
        "trade_notes": payload.trade_notes,
        "created_at": str(row.created_at),
    }

@app.patch("/trades/{trade_id}/close")
def close_trade(trade_id: str, payload: TradeExitRequest):
    with engine.begin() as conn:
        trade = conn.execute(
            text("SELECT * FROM trades WHERE id = :id"),
            {"id": trade_id}
        ).fetchone()

        if not trade:
            raise HTTPException(status_code=404, detail="Trade not found")

        account = conn.execute(
            text("SELECT current_balance FROM accounts WHERE id = :account_id"),
            {"account_id": trade.account_id}
        ).fetchone()
        account_balance = float(account.current_balance) if account and account.current_balance else 1000

        result = calculate_trade_result(
            entry=float(trade.entry_price),
            stop_loss=float(trade.stop_loss),
            take_profit=float(trade.take_profit),
            exit_price=payload.exit_price,
            position_size=float(trade.position_size),
            direction=Direction(trade.direction),
            risk_amount=float(trade.risk_amount),
            account_balance=account_balance,
        )

        conn.execute(
            text("""
                UPDATE trades SET
                    exit_price = :exit_price,
                    planned_rr = :planned_rr,
                    realized_rr = :realized_rr,
                    pl_amount = :pl_amount,
                    pl_percentage = :pl_percentage,
                    trade_result = :trade_result,
                    execution_rating = :execution_rating,
                    mistake_notes = :mistake_notes,
                    updated_at = NOW()
                WHERE id = :id
            """),
            {
                "exit_price": payload.exit_price,
                "planned_rr": result.planned_rr,
                "realized_rr": result.realized_rr,
                "pl_amount": result.pl_amount,
                "pl_percentage": result.pl_percentage,
                "trade_result": result.trade_result,
                "execution_rating": payload.execution_rating,
                "mistake_notes": payload.mistake_notes,
                "id": trade_id,
            }
        )

    return {
        "id": trade_id,
        "exit_price": payload.exit_price,
        "planned_rr": result.planned_rr,
        "realized_rr": result.realized_rr,
        "pl_amount": result.pl_amount,
        "pl_percentage": result.pl_percentage,
        "trade_result": result.trade_result,
    }


@app.get("/trades")
def list_trades(account_id: Optional[str] = None):
    query = "SELECT * FROM trades"
    params = {}
    if account_id:
        query += " WHERE account_id = :account_id"
        params["account_id"] = account_id
    query += " ORDER BY trade_date DESC"

    with engine.connect() as conn:
        rows = conn.execute(text(query), params).fetchall()

    return [dict(row._mapping) for row in rows]


@app.get("/trades/calendar/{trade_date}")
def get_trades_by_date(trade_date: date):
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT * FROM trades WHERE trade_date = :trade_date"),
            {"trade_date": trade_date}
        ).fetchall()

    return [dict(row._mapping) for row in rows]


@app.get("/trades/calendar-summary")
def calendar_summary(account_id: str, year: int, month: int):
    """
    Returns trade counts + total P/L per day for a given month.
    Powers the calendar view.
    """
    with engine.connect() as conn:
        rows = conn.execute(
            text("""
                SELECT trade_date, trade_result, pl_amount
                FROM trades
                WHERE account_id = :account_id
                AND EXTRACT(YEAR FROM trade_date) = :year
                AND EXTRACT(MONTH FROM trade_date) = :month
            """),
            {"account_id": account_id, "year": year, "month": month}
        ).fetchall()

    day_summary = defaultdict(lambda: {"count": 0, "total_pl": 0.0, "wins": 0, "losses": 0})
    for r in rows:
        day_key = r.trade_date.isoformat()
        day_summary[day_key]["count"] += 1
        day_summary[day_key]["total_pl"] += float(r.pl_amount or 0)
        if r.trade_result == "win":
            day_summary[day_key]["wins"] += 1
        elif r.trade_result == "loss":
            day_summary[day_key]["losses"] += 1

    return {
        date_str: {
            "count": v["count"],
            "total_pl": round(v["total_pl"], 2),
            "wins": v["wins"],
            "losses": v["losses"],
        }
        for date_str, v in day_summary.items()
    }


@app.get("/dashboard/summary")
def account_summary(account_id: str):
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT * FROM trades WHERE account_id = :account_id AND trade_result IS NOT NULL"),
            {"account_id": account_id}
        ).fetchall()

        account = conn.execute(
            text("SELECT current_balance FROM accounts WHERE id = :account_id"),
            {"account_id": account_id}
        ).fetchone()

    total_trades = len(rows)
    wins = [r for r in rows if r.trade_result == "win"]
    losses = [r for r in rows if r.trade_result == "loss"]

    total_profit = sum(float(r.pl_amount) for r in wins)
    total_loss = sum(abs(float(r.pl_amount)) for r in losses)
    win_rate = round((len(wins) / total_trades) * 100, 1) if total_trades else 0

    return {
        "total_profit": round(total_profit, 2),
        "total_loss": round(total_loss, 2),
        "win_rate": win_rate,
        "total_trades": total_trades,
        "current_balance": float(account.current_balance) if account else 0,
    }


@app.get("/dashboard/statistics")
def account_statistics(account_id: str):
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT * FROM trades WHERE account_id = :account_id AND trade_result IS NOT NULL"),
            {"account_id": account_id}
        ).fetchall()

    total_trades = len(rows)
    if total_trades == 0:
        return {
            "win_rate": 0,
            "average_rr": 0,
            "profit_factor": 0,
            "best_month": None,
            "worst_month": None,
        }

    wins = [r for r in rows if r.trade_result == "win"]
    losses = [r for r in rows if r.trade_result == "loss"]

    win_rate = round((len(wins) / total_trades) * 100, 1)
    avg_rr = round(sum(float(r.realized_rr) for r in rows) / total_trades, 2)

    total_profit = sum(float(r.pl_amount) for r in wins)
    total_loss = abs(sum(float(r.pl_amount) for r in losses))
    profit_factor = round(total_profit / total_loss, 2) if total_loss > 0 else total_profit

    monthly_pl = defaultdict(float)
    for r in rows:
        month_key = r.trade_date.strftime("%Y-%m")
        monthly_pl[month_key] += float(r.pl_amount)

    best_month = max(monthly_pl.items(), key=lambda x: x[1]) if monthly_pl else None
    worst_month = min(monthly_pl.items(), key=lambda x: x[1]) if monthly_pl else None

    return {
        "win_rate": win_rate,
        "average_rr": avg_rr,
        "profit_factor": profit_factor,
        "best_month": {"month": best_month[0], "pl": round(best_month[1], 2)} if best_month else None,
        "worst_month": {"month": worst_month[0], "pl": round(worst_month[1], 2)} if worst_month else None,
    }


@app.get("/intelligence/personal-performance")
def personal_performance(account_id: str):
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT * FROM trades WHERE account_id = :account_id AND trade_result IS NOT NULL"),
            {"account_id": account_id}
        ).fetchall()

    if not rows:
        return {
            "total_trades": 0,
            "win_rate": 0,
            "average_rr": 0,
            "best_asset": None,
            "worst_asset": None,
            "best_strategy": None,
            "best_setup": None,
            "buy_vs_sell": {"buy": None, "sell": None},
            "monthly_performance": [],
            "top_mistakes": [],
            "emotion_breakdown": [],
        }

    total_trades = len(rows)
    wins = [r for r in rows if r.trade_result == "win"]
    win_rate = round((len(wins) / total_trades) * 100, 1)
    avg_rr = round(sum(float(r.realized_rr or 0) for r in rows) / total_trades, 2)

    asset_pl = defaultdict(float)
    for r in rows:
        asset_pl[r.asset] += float(r.pl_amount or 0)
    best_asset = max(asset_pl.items(), key=lambda x: x[1]) if asset_pl else None
    worst_asset = min(asset_pl.items(), key=lambda x: x[1]) if asset_pl else None

    strategy_pl = defaultdict(float)
    for r in rows:
        if r.strategy:
            strategy_pl[r.strategy] += float(r.pl_amount or 0)
    best_strategy = max(strategy_pl.items(), key=lambda x: x[1]) if strategy_pl else None

    setup_pl = defaultdict(float)
    for r in rows:
        if r.setup:
            setup_pl[r.setup] += float(r.pl_amount or 0)
    best_setup = max(setup_pl.items(), key=lambda x: x[1]) if setup_pl else None

    buy_trades = [r for r in rows if r.direction == "buy"]
    sell_trades = [r for r in rows if r.direction == "sell"]

    def direction_stats(trade_list):
        if not trade_list:
            return None
        wins_d = [t for t in trade_list if t.trade_result == "win"]
        return {
            "count": len(trade_list),
            "win_rate": round((len(wins_d) / len(trade_list)) * 100, 1),
            "total_pl": round(sum(float(t.pl_amount or 0) for t in trade_list), 2),
        }

    buy_vs_sell = {"buy": direction_stats(buy_trades), "sell": direction_stats(sell_trades)}

    monthly_pl = defaultdict(float)
    for r in rows:
        month_key = r.trade_date.strftime("%Y-%m")
        monthly_pl[month_key] += float(r.pl_amount or 0)
    monthly_performance = [{"month": k, "pl": round(v, 2)} for k, v in sorted(monthly_pl.items())]

    mistake_count = defaultdict(int)
    for r in rows:
        if r.mistake_notes and r.mistake_notes.strip():
            mistake_count[r.mistake_notes.strip()] += 1
    top_mistakes = sorted(mistake_count.items(), key=lambda x: x[1], reverse=True)[:5]
    top_mistakes = [{"mistake": m, "count": c} for m, c in top_mistakes]

    emotion_pl = defaultdict(lambda: {"count": 0, "wins": 0, "total_pl": 0.0})
    for r in rows:
        if r.emotion:
            emotion_pl[r.emotion]["count"] += 1
            emotion_pl[r.emotion]["total_pl"] += float(r.pl_amount or 0)
            if r.trade_result == "win":
                emotion_pl[r.emotion]["wins"] += 1

    emotion_breakdown = [
        {
            "emotion": e,
            "count": v["count"],
            "win_rate": round((v["wins"] / v["count"]) * 100, 1),
            "total_pl": round(v["total_pl"], 2),
        }
        for e, v in emotion_pl.items()
    ]

    return {
        "total_trades": total_trades,
        "win_rate": win_rate,
        "average_rr": avg_rr,
        "best_asset": {"asset": best_asset[0], "pl": round(best_asset[1], 2)} if best_asset else None,
        "worst_asset": {"asset": worst_asset[0], "pl": round(worst_asset[1], 2)} if worst_asset else None,
        "best_strategy": {"strategy": best_strategy[0], "pl": round(best_strategy[1], 2)} if best_strategy else None,
        "best_setup": {"setup": best_setup[0], "pl": round(best_setup[1], 2)} if best_setup else None,
        "buy_vs_sell": buy_vs_sell,
        "monthly_performance": monthly_performance,
        "top_mistakes": top_mistakes,
        "emotion_breakdown": emotion_breakdown,
    }


@app.get("/intelligence/community-performance")
def community_performance():
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT * FROM trades WHERE trade_result IS NOT NULL")
        ).fetchall()

    if not rows:
        return {
            "total_trades": 0,
            "community_win_rate": 0,
            "community_avg_rr": 0,
            "most_profitable_asset": None,
            "best_strategy": None,
            "best_setup": None,
            "buy_vs_sell": {"buy": None, "sell": None},
            "common_mistakes": [],
            "emotion_stats": [],
        }

    total_trades = len(rows)
    wins = [r for r in rows if r.trade_result == "win"]
    win_rate = round((len(wins) / total_trades) * 100, 1)
    avg_rr = round(sum(float(r.realized_rr or 0) for r in rows) / total_trades, 2)

    asset_pl = defaultdict(float)
    for r in rows:
        asset_pl[r.asset] += float(r.pl_amount or 0)
    most_profitable_asset = max(asset_pl.items(), key=lambda x: x[1]) if asset_pl else None

    strategy_pl = defaultdict(float)
    for r in rows:
        if r.strategy:
            strategy_pl[r.strategy] += float(r.pl_amount or 0)
    best_strategy = max(strategy_pl.items(), key=lambda x: x[1]) if strategy_pl else None

    setup_pl = defaultdict(float)
    for r in rows:
        if r.setup:
            setup_pl[r.setup] += float(r.pl_amount or 0)
    best_setup = max(setup_pl.items(), key=lambda x: x[1]) if setup_pl else None

    buy_trades = [r for r in rows if r.direction == "buy"]
    sell_trades = [r for r in rows if r.direction == "sell"]

    def direction_stats(trade_list):
        if not trade_list:
            return None
        wins_d = [t for t in trade_list if t.trade_result == "win"]
        return {
            "count": len(trade_list),
            "win_rate": round((len(wins_d) / len(trade_list)) * 100, 1),
        }

    buy_vs_sell = {"buy": direction_stats(buy_trades), "sell": direction_stats(sell_trades)}

    mistake_count = defaultdict(int)
    for r in rows:
        if r.mistake_notes and r.mistake_notes.strip():
            mistake_count[r.mistake_notes.strip()] += 1
    common_mistakes = sorted(mistake_count.items(), key=lambda x: x[1], reverse=True)[:5]
    common_mistakes = [{"mistake": m, "count": c} for m, c in common_mistakes]

    emotion_pl = defaultdict(lambda: {"count": 0, "wins": 0})
    for r in rows:
        if r.emotion:
            emotion_pl[r.emotion]["count"] += 1
            if r.trade_result == "win":
                emotion_pl[r.emotion]["wins"] += 1

    emotion_stats = [
        {
            "emotion": e,
            "count": v["count"],
            "win_rate": round((v["wins"] / v["count"]) * 100, 1),
        }
        for e, v in emotion_pl.items()
    ]

    return {
        "total_trades": total_trades,
        "community_win_rate": win_rate,
        "community_avg_rr": avg_rr,
        "most_profitable_asset": {"asset": most_profitable_asset[0], "pl": round(most_profitable_asset[1], 2)} if most_profitable_asset else None,
        "best_strategy": {"strategy": best_strategy[0], "pl": round(best_strategy[1], 2)} if best_strategy else None,
        "best_setup": {"setup": best_setup[0], "pl": round(best_setup[1], 2)} if best_setup else None,
        "buy_vs_sell": buy_vs_sell,
        "common_mistakes": common_mistakes,
        "emotion_stats": emotion_stats,
    }
class ProfileUpdateRequest(BaseModel):
    user_id: str
    name: str
    currency: str

class AccountCreateRequest(BaseModel):
    user_id: str
    account_name: str
    account_type: str
    starting_balance: float = 0


@app.get("/settings/profile")
def get_profile(user_id: str):
    with engine.connect() as conn:
        user = conn.execute(
            text("SELECT id, name, email, currency FROM users WHERE id = :user_id"),
            {"user_id": user_id}
        ).fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "currency": user.currency,
    }


class ProfileUpdateRequest(BaseModel):
    user_id: str
    name: str
    currency: str

class AccountCreateRequest(BaseModel):
    user_id: str
    account_name: str
    account_type: str
    starting_balance: float = 0


@app.get("/settings/profile")
def get_profile(user_id: str):
    with engine.connect() as conn:
        user = conn.execute(
            text("SELECT id, name, email, currency FROM users WHERE id = :user_id"),
            {"user_id": user_id}
        ).fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "currency": user.currency,
    }


@app.patch("/settings/profile")
def update_profile(payload: ProfileUpdateRequest):
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE users SET name = :name, currency = :currency, updated_at = NOW()
                WHERE id = :user_id
            """),
            {"name": payload.name, "currency": payload.currency, "user_id": payload.user_id}
        )

    return {"message": "Profile updated successfully"}


@app.get("/accounts")
def list_accounts(user_id: str):
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT * FROM accounts WHERE user_id = :user_id ORDER BY created_at"),
            {"user_id": user_id}
        ).fetchall()

    return [dict(row._mapping) for row in rows]


@app.post("/accounts")
def create_account(payload: AccountCreateRequest):
    with engine.begin() as conn:
        result = conn.execute(
            text("""
                INSERT INTO accounts (user_id, account_name, account_type, starting_balance, current_balance)
                VALUES (:user_id, :account_name, :account_type, :starting_balance, :starting_balance)
                RETURNING id
            """),
            {
                "user_id": payload.user_id,
                "account_name": payload.account_name,
                "account_type": payload.account_type,
                "starting_balance": payload.starting_balance,
            }
        )
        account_id = result.fetchone()[0]

    return {"message": "Account created successfully", "account_id": str(account_id)}
class ProfileUpdateRequest(BaseModel):
    user_id: str
    name: str
    currency: str

class AccountCreateRequest(BaseModel):
    user_id: str
    account_name: str
    account_type: str
    starting_balance: float = 0


@app.get("/settings/profile")
def get_profile(user_id: str):
    with engine.connect() as conn:
        user = conn.execute(
            text("SELECT id, name, email, currency FROM users WHERE id = :user_id"),
            {"user_id": user_id}
        ).fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "currency": user.currency,
    }


@app.patch("/settings/profile")
def update_profile(payload: ProfileUpdateRequest):
    with engine.begin() as conn:
        conn.execute(
            text("""
                UPDATE users SET name = :name, currency = :currency, updated_at = NOW()
                WHERE id = :user_id
            """),
            {"name": payload.name, "currency": payload.currency, "user_id": payload.user_id}
        )

    return {"message": "Profile updated successfully"}


@app.get("/accounts")
def list_accounts(user_id: str):
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT * FROM accounts WHERE user_id = :user_id ORDER BY created_at"),
            {"user_id": user_id}
        ).fetchall()

    return [dict(row._mapping) for row in rows]


@app.post("/accounts")
def create_account(payload: AccountCreateRequest):
    with engine.begin() as conn:
        result = conn.execute(
            text("""
                INSERT INTO accounts (user_id, account_name, account_type, starting_balance, current_balance)
                VALUES (:user_id, :account_name, :account_type, :starting_balance, :starting_balance)
                RETURNING id
            """),
            {
                "user_id": payload.user_id,
                "account_name": payload.account_name,
                "account_type": payload.account_type,
                "starting_balance": payload.starting_balance,
            }
        )
        account_id = result.fetchone()[0]

    return {"message": "Account created successfully", "account_id": str(account_id)}
# --- Tradexa Learning: static lesson library ---
LESSONS = [
    {"id": 1, "title": "Risk Management Basics", "category": "Risk Management", "duration_minutes": 18, "description": "Learn how to size positions and protect your capital."},
    {"id": 2, "title": "Trading Psychology 101", "category": "Trading Psychology", "duration_minutes": 25, "description": "Understand the emotional traps that damage trading performance."},
    {"id": 3, "title": "Order Blocks Explained", "category": "Smart Money Concepts", "duration_minutes": 30, "description": "How institutional order blocks influence price action."},
    {"id": 4, "title": "Reading Candlestick Patterns", "category": "Technical Analysis", "duration_minutes": 20, "description": "The most reliable candlestick patterns and how to trade them."},
    {"id": 5, "title": "Understanding Economic Calendars", "category": "Fundamental Analysis", "duration_minutes": 15, "description": "How news events move markets and how to prepare for them."},
    {"id": 6, "title": "Position Sizing Formulas", "category": "Risk Management", "duration_minutes": 22, "description": "Exact formulas to calculate position size based on risk %."},
    {"id": 7, "title": "Overcoming FOMO", "category": "Trading Psychology", "duration_minutes": 16, "description": "Practical techniques to stop chasing trades."},
    {"id": 8, "title": "Liquidity Sweeps & Stop Hunts", "category": "Smart Money Concepts", "duration_minutes": 28, "description": "How liquidity grabs work and how to trade around them."},
    {"id": 9, "title": "Indian Market Trading Hours & Rules", "category": "Indian Market", "duration_minutes": 12, "description": "Key rules and timing specifics for trading Indian markets."},
    {"id": 10, "title": "Building a Trading Routine", "category": "Trading Psychology", "duration_minutes": 20, "description": "A repeatable daily process used by consistent traders."},
]

# Maps a mistake string (as typed in journal mistake_notes) to a relevant lesson category
MISTAKE_TO_CATEGORY = {
    "fomo": "Trading Psychology",
    "revenge trading": "Trading Psychology",
    "overleveraging": "Risk Management",
    "no stop loss": "Risk Management",
    "moved stop loss": "Risk Management",
    "chased entry": "Trading Psychology",
    "ignored news": "Fundamental Analysis",
    "wrong position size": "Risk Management",
    "impatience": "Trading Psychology",
}


@app.get("/learning/lessons")
def get_lessons(category: Optional[str] = None):
    if category:
        return [l for l in LESSONS if l["category"] == category]
    return LESSONS


@app.get("/learning/recommended")
def get_recommended_lessons(account_id: str):
    """
    Powers Dashboard 'Recommended Lessons' + Tradexa Learning > Mistake-Based Learning.
    Looks at the user's most common mistakes and recommends matching lessons.
    """
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT mistake_notes FROM trades WHERE account_id = :account_id AND mistake_notes IS NOT NULL"),
            {"account_id": account_id}
        ).fetchall()

    mistake_count = defaultdict(int)
    for r in rows:
        note = (r.mistake_notes or "").strip().lower()
        if note:
            mistake_count[note] += 1

    if not mistake_count:
        # No mistakes logged yet — just return a few beginner-friendly defaults
        defaults = [l for l in LESSONS if l["category"] in ("Risk Management", "Trading Psychology")][:3]
        return {"based_on_mistakes": False, "recommendations": defaults}

    top_mistakes = sorted(mistake_count.items(), key=lambda x: x[1], reverse=True)[:3]

    recommendations = []
    seen_ids = set()
    for mistake_text, count in top_mistakes:
        matched_category = None
        for key, category in MISTAKE_TO_CATEGORY.items():
            if key in mistake_text:
                matched_category = category
                break

        if matched_category:
            lesson = next((l for l in LESSONS if l["category"] == matched_category), None)
            if lesson and lesson["id"] not in seen_ids:
                recommendations.append({**lesson, "recommended_because": f'Mistake: "{mistake_text}" ({count}x)'})
                seen_ids.add(lesson["id"])

    if not recommendations:
        recommendations = [{**l, "recommended_because": "General improvement area"} for l in LESSONS[:3]]

    return {"based_on_mistakes": True, "recommendations": recommendations}

class CoachScoreRequest(BaseModel):
    account_id: str
    asset: str
    setup: str
    strategy: str
    emotion: str


from app.tradexa_intelligence import get_tradexa_intelligence


class CoachScoreRequest(BaseModel):
    account_id: str
    asset: str
    setup: str
    strategy: str
    emotion: str


class CoachScoreRequest(BaseModel):
    account_id: str
    asset: str
    setup: str
    strategy: str
    emotion: str


@app.post("/coach/score-trade")
def score_trade(payload: CoachScoreRequest):
    """
    Powers Tradexa Coach > Before Taking Trade.
    Scores a proposed trade out of 30 using:
    - Personal history (asset)      /5
    - Community history (setup)     /5
    - Real Fundamental data         /5
    - Real 1D Technical             /5
    - Real 4H Technical             /5
    - Personal emotion history      /5
    """
    with engine.connect() as conn:
        personal_asset_trades = conn.execute(
            text("SELECT trade_result FROM trades WHERE account_id = :account_id AND LOWER(asset) = LOWER(:asset) AND trade_result IS NOT NULL"),
            {"account_id": payload.account_id, "asset": payload.asset}
        ).fetchall()

        community_setup_trades = conn.execute(
            text("SELECT trade_result FROM trades WHERE LOWER(setup) = LOWER(:setup) AND trade_result IS NOT NULL"),
            {"setup": payload.setup}
        ).fetchall()

        personal_emotion_trades = conn.execute(
            text("SELECT trade_result FROM trades WHERE account_id = :account_id AND LOWER(emotion) = LOWER(:emotion) AND trade_result IS NOT NULL"),
            {"account_id": payload.account_id, "emotion": payload.emotion}
        ).fetchall()

    def win_rate(trades):
        if not trades:
            return None
        wins = len([t for t in trades if t.trade_result == "win"])
        return round((wins / len(trades)) * 100, 1)

    def score_from_win_rate(wr, max_points=5):
        if wr is None:
            return round(max_points * 0.6, 1)
        return round((wr / 100) * max_points, 1)

    personal_wr = win_rate(personal_asset_trades)
    community_wr = win_rate(community_setup_trades)
    emotion_wr = win_rate(personal_emotion_trades)

    personal_score = score_from_win_rate(personal_wr, 5)
    community_score = score_from_win_rate(community_wr, 5)
    sentiment_history_score = score_from_win_rate(emotion_wr, 5)

    intelligence = get_tradexa_intelligence(payload.asset)

    if intelligence:
        daily_score = intelligence["technical"]["daily"].get("score", 2.5) if intelligence["technical"].get("daily") else 2.5
        h4_score = intelligence["technical"]["h4"].get("score", 2.5) if intelligence["technical"].get("h4") else 2.5
        fundamental_score = intelligence["fundamental"].get("score", 2.5) or 2.5
        market_note = None
    else:
        daily_score = 2.5
        h4_score = 2.5
        fundamental_score = 2.5
        market_note = f"'{payload.asset}' not recognized by Market Intelligence — using neutral defaults"

    total_score = round(
        personal_score + community_score + fundamental_score +
        daily_score + h4_score + sentiment_history_score, 1
    )

    if total_score >= 24:
        recommendation = "Highly Recommended"
    elif total_score >= 18:
        recommendation = "Recommended"
    elif total_score >= 12:
        recommendation = "Proceed with Caution"
    else:
        recommendation = "Not Recommended"

    if total_score >= 20:
        risk = "Low"
    elif total_score >= 13:
        risk = "Medium"
    else:
        risk = "High"

    breakdown = {
        "personal_history": {"score": personal_score, "max": 5, "win_rate": personal_wr, "trades_analyzed": len(personal_asset_trades)},
        "community_history": {"score": community_score, "max": 5, "win_rate": community_wr, "trades_analyzed": len(community_setup_trades)},
        "fundamental": {"score": fundamental_score, "max": 5, "note": "Live FRED data" if intelligence else "Neutral default"},
        "technical_1d": {"score": daily_score, "max": 5, "note": "Live TwelveData" if intelligence else "Neutral default"},
        "technical_4h": {"score": h4_score, "max": 5, "note": "Live TwelveData" if intelligence else "Neutral default"},
        "sentiment": {"score": sentiment_history_score, "max": 5, "win_rate": emotion_wr, "note": f'Based on your "{payload.emotion}" trade history'},
    }

    return {
        "asset": payload.asset,
        "total_score": total_score,
        "max_score": 30,
        "recommendation": recommendation,
        "risk": risk,
        "breakdown": breakdown,
        "your_win_rate": personal_wr,
        "community_win_rate": community_wr,
        "market_intelligence_available": intelligence is not None,
        "market_note": market_note,
        "live_market_decision": intelligence["decision"] if intelligence else None,
    }

from app.market_intelligence import get_asset_technical_analysis, ASSET_SYMBOLS


@app.get("/market/assets")
def list_available_assets():
    """Returns the list of assets Tradexa can currently analyze."""
    return {"assets": list(ASSET_SYMBOLS.keys())}


@app.get("/market/asset-score/{asset_name}")
def asset_score(asset_name: str):
    """
    Powers Market Intelligence > Asset Score.
    Real technical score (1D + 4H) from live price data.
    Fundamental + Sentiment remain heuristic placeholders until a paid data source is added.
    """
    analysis = get_asset_technical_analysis(asset_name)
    if not analysis or not analysis["daily"]:
        raise HTTPException(status_code=404, detail=f"No data available for '{asset_name}'. Try: Gold, EURUSD, BTC, Nifty, Reliance, AAPL, TSLA")

    daily_score = analysis["daily"]["score"] if analysis["daily"] else 2.5
    h4_score = analysis["h4"]["score"] if analysis["h4"] else 2.5
    technical_score = round((daily_score + h4_score) / 2, 1)

    # Fundamental & sentiment: honest heuristic placeholders (not live data yet)
    fundamental_score = 2.5
    sentiment_score = 2.5

    overall = round(technical_score + fundamental_score + sentiment_score, 1)
    overall_15 = round((overall / 15) * 15, 1)

    return {
        "asset": asset_name,
        "technical_score": technical_score,
        "technical_max": 5,
        "fundamental_score": fundamental_score,
        "fundamental_max": 5,
        "fundamental_note": "Heuristic placeholder — needs economic calendar data source",
        "sentiment_score": sentiment_score,
        "sentiment_max": 5,
        "sentiment_note": "Heuristic placeholder — needs retail sentiment data source",
        "overall_score": overall_15,
        "overall_max": 15,
        "daily_analysis": analysis["daily"],
        "h4_analysis": analysis["h4"],
    }


@app.get("/market/top-scorer")
def top_scorer():
    """
    Returns a lightweight Top Scorer list.

    Uses only the daily timeframe for ranking so we don't
    consume excessive TwelveData API requests.

    Fundamental and sentiment are currently neutral
    because those data sources have not been connected yet.
    """

    results = []

    # Limit the number of assets checked by Top Scorer.
    # Asset Score can still perform full 1D + 4H analysis
    # when the user selects an individual asset.
    top_assets = [
        "Gold",
        "EURUSD",
        "GBPUSD",
        "USDJPY",
        "BTC",
        "ETH",
        "Nifty",
        "Reliance",
        "AAPL",
        "TSLA",
    ]

    for asset_name in top_assets:

        if asset_name not in ASSET_SYMBOLS:
            continue

        try:
            # Only ONE API request per asset for Top Scorer.
            daily_candles = get_time_series(
                ASSET_SYMBOLS[asset_name],
                interval="1day",
                outputsize=30
            )

            if not daily_candles:
                continue

            daily_analysis = calculate_technical_score(
                daily_candles
            )

            if not daily_analysis:
                continue

            technical_score = daily_analysis["score"]

            # Current placeholders.
            fundamental_score = 2.5
            sentiment_score = 2.5

            overall_score = round(
                technical_score
                + fundamental_score
                + sentiment_score,
                1
            )

            results.append({
                "asset": asset_name,
                "score": overall_score,
                "max_score": 15,
                "trend": daily_analysis["trend"],
                "technical_score": technical_score,
                "current_price": daily_analysis.get(
                    "current_price"
                ),
            })

        except Exception as e:
            print(
                f"Top Scorer error for {asset_name}: {e}"
            )
            continue

    # Highest score first
    results.sort(
        key=lambda x: x["score"],
        reverse=True
    )

    return {
        "results": results,
        "count": len(results)
    }



@app.get("/market/intelligence/{asset_name}")
def tradexa_intelligence_alias_route(asset_name: str):
    result = get_tradexa_intelligence(asset_name)

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No intelligence data available for '{asset_name}'"
        )

    return result
    """
    Returns Tradexa Intelligence analysis
    for a selected asset.
    """

    result = get_tradexa_intelligence(
        asset_name
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail=(
                f"No intelligence data available "
                f"for '{asset_name}'"
            ),
        )

    return result


@app.get("/intelligence/{asset_name}")
def intelligence_route(asset_name: str):
    result = get_tradexa_intelligence(asset_name)

    if not result:
        raise HTTPException(
            status_code=404,
            detail=f"No intelligence data available for '{asset_name}'"
        )

    return result