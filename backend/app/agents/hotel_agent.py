from .state import TripState


def hotel_planner_agent(state: TripState) -> dict:
    destination = state.get("destination", "")
    budget = state.get("budget", 0.0)
    start_date = state.get("start_date", "")
    end_date = state.get("end_date", "")

    nights = 5
    max_allowable_lodging = (budget * 0.40) / nights

    hotel_options = [
        {
            "name": "Boutique Palace Hotel",
            "location": destination,
            "rating": 4.8,
            "nightly_rate": round(min(195.00, max_allowable_lodging), 2),
            "amenities": ["WiFi", "Breakfast Included", "Gym"],
            "check_in": start_date,
            "check_out": end_date,
            "total_cost": round(min(195.00, max_allowable_lodging) * nights, 2),
        },
        {
            "name": "City Comfort Inn",
            "location": destination,
            "rating": 4.2,
            "nightly_rate": round(min(120.00, max_allowable_lodging), 2),
            "amenities": ["WiFi", "Free Parking"],
            "check_in": start_date,
            "check_out": end_date,
            "total_cost": round(min(120.00, max_allowable_lodging) * nights, 2),
        },
        {
            "name": "Grand Luxe Resort",
            "location": destination,
            "rating": 4.9,
            "nightly_rate": round(min(350.00, max_allowable_lodging * 1.5), 2),
            "amenities": ["WiFi", "Breakfast Included", "Spa", "Pool", "Gym"],
            "check_in": start_date,
            "check_out": end_date,
            "total_cost": round(min(350.00, max_allowable_lodging * 1.5) * nights, 2),
        },
    ]

    return {"hotels": hotel_options}
