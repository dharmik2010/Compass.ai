import math
from .state import TripState


def packing_agent(state: TripState) -> dict:
    start_date = state.get("start_date", "")
    end_date = state.get("end_date", "")
    interests = state.get("interests", [])
    packing_style = state.get("packing_style", "balanced")

    style_factor = {"ultralight": 0.6, "balanced": 1.0, "comprehensive": 1.5}
    sf = style_factor.get(packing_style, 1.0)

    try:
        from datetime import datetime
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        duration = max((end - start).days, 1)
    except (ValueError, TypeError):
        duration = 5

    base_consumption = {
        "underwear": 1.0, "socks": 1.0, "t_shirts": 0.8,
        "pants": 0.5, "shorts": 0.3, "sleepwear": 0.3, "formal_shirts": 0.2,
    }

    climate_modifiers = {
        "underwear": 1.1, "socks": 1.2, "t_shirts": 1.0,
        "pants": 1.0, "shorts": 0.5, "sleepwear": 1.0, "formal_shirts": 1.0,
    }

    activity_modifiers = {
        "hiking": {"socks": 0.3, "t_shirts": 0.2},
        "formal_dining": {"formal_shirts": 0.5, "pants": 0.2},
        "swimming": {"shorts": 0.3},
        "outdoor": {"socks": 0.2, "t_shirts": 0.2},
    }

    items = {}
    for category, base_rate in base_consumption.items():
        base_qty = base_rate * duration * sf
        climate_adj = climate_modifiers.get(category, 1.0)
        activity_adj = 0.0
        for interest in interests:
            for act_cat, modifiers in activity_modifiers.items():
                if act_cat in interest.lower() or interest.lower() in act_cat:
                    activity_adj += modifiers.get(category, 0.0)
        total = base_qty * climate_adj + activity_adj * duration * sf
        items[category] = max(1, math.ceil(total))

    packing_list = {
        "clothing": [
            {"item": "Underwear", "quantity": items["underwear"], "bag_allocation": "carry_on"},
            {"item": "Socks", "quantity": items["socks"], "bag_allocation": "carry_on"},
            {"item": "T-Shirts", "quantity": items["t_shirts"], "bag_allocation": "carry_on"},
            {"item": "Pants", "quantity": items["pants"], "bag_allocation": "checked_bag"},
            {"item": "Shorts", "quantity": items["shorts"], "bag_allocation": "checked_bag"},
            {"item": "Sleepwear", "quantity": items["sleepwear"], "bag_allocation": "carry_on"},
            {"item": "Formal Shirts", "quantity": items["formal_shirts"], "bag_allocation": "checked_bag"},
        ],
        "toiletries": [
            {"item": "Toothbrush & Toothpaste", "quantity": 1, "bag_allocation": "carry_on"},
            {"item": "Shampoo & Conditioner", "quantity": 1, "bag_allocation": "checked_bag"},
            {"item": "Deodorant", "quantity": 1, "bag_allocation": "carry_on"},
            {"item": "Sunscreen SPF 50+", "quantity": 1, "bag_allocation": "carry_on"},
        ],
        "electronics": [
            {"item": "Phone Charger", "quantity": 1, "bag_allocation": "carry_on"},
            {"item": "Power Bank", "quantity": 1, "bag_allocation": "carry_on"},
            {"item": "Universal Travel Adapter", "quantity": 1, "bag_allocation": "carry_on"},
        ],
        "documents": [
            {"item": "Passport / ID", "quantity": 1, "bag_allocation": "carry_on"},
            {"item": "Travel Insurance", "quantity": 1, "bag_allocation": "carry_on"},
            {"item": "Booking Confirmations", "quantity": 1, "bag_allocation": "carry_on"},
        ],
    }

    return {"packing_list": packing_list}
