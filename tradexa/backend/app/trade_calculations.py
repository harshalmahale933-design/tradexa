"""
Tradexa - Trade Calculation Engine
====================================
Powers auto-calculation in the Trade Journal after Exit Price is entered.
"""

from dataclasses import dataclass
from enum import Enum


class Direction(str, Enum):
    BUY = "buy"
    SELL = "sell"


class TradeResult(str, Enum):
    WIN = "win"
    LOSS = "loss"
    BREAKEVEN = "breakeven"


@dataclass
class TradeCalculationResult:
    planned_rr: float
    realized_rr: float
    pl_amount: float
    pl_percentage: float
    trade_result: str


def calculate_planned_rr(entry: float, stop_loss: float, take_profit: float, direction: Direction) -> float:
    risk = abs(entry - stop_loss)
    reward = abs(take_profit - entry)
    if risk == 0:
        return 0.0
    return round(reward / risk, 2)


def calculate_trade_result(
    entry: float,
    stop_loss: float,
    take_profit: float,
    exit_price: float,
    position_size: float,
    direction: Direction,
    risk_amount: float,
    account_balance: float,
) -> TradeCalculationResult:

    planned_rr = calculate_planned_rr(entry, stop_loss, take_profit, direction)

    if direction == Direction.BUY:
        price_diff = exit_price - entry
    else:
        price_diff = entry - exit_price

    pl_amount = round(price_diff * position_size, 2)
    pl_percentage = round((pl_amount / account_balance) * 100, 4) if account_balance else 0.0

    risk_per_unit = abs(entry - stop_loss)
    if risk_per_unit == 0:
        realized_rr = 0.0
    else:
        realized_rr = round(price_diff / risk_per_unit, 2)

    breakeven_tolerance = 0.05
    if abs(pl_amount) <= (risk_amount * breakeven_tolerance):
        trade_result = TradeResult.BREAKEVEN
    elif pl_amount > 0:
        trade_result = TradeResult.WIN
    else:
        trade_result = TradeResult.LOSS

    return TradeCalculationResult(
        planned_rr=planned_rr,
        realized_rr=realized_rr,
        pl_amount=pl_amount,
        pl_percentage=pl_percentage,
        trade_result=trade_result.value,
    )


if __name__ == "__main__":
    result = calculate_trade_result(
        entry=1950.00,
        stop_loss=1945.00,
        take_profit=1965.00,
        exit_price=1962.00,
        position_size=10,
        direction=Direction.BUY,
        risk_amount=50.00,
        account_balance=1000.00,
    )
    print(result)