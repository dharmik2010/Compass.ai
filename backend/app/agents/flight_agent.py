from .state import TripState


def flight_planner_agent(state: TripState) -> dict:
    origin = state.get("origin", "")
    destination = state.get("destination", "")
    start_date = state.get("start_date", "")

    flight_options = [
        {
            "carrier": "United Airlines",
            "flight_number": "UA901",
            "route": f"{origin} -> {destination}",
            "departure": f"{start_date}T07:30:00Z",
            "arrival": f"{start_date}T11:45:00Z",
            "price": 520.00,
            "cabin": "Economy",
            "duration_minutes": 255,
        },
        {
            "carrier": "Delta Air Lines",
            "flight_number": "DL402",
            "route": f"{origin} -> {destination}",
            "departure": f"{start_date}T14:15:00Z",
            "arrival": f"{start_date}T18:30:00Z",
            "price": 480.00,
            "cabin": "Economy",
            "duration_minutes": 255,
        },
        {
            "carrier": "American Airlines",
            "flight_number": "AA715",
            "route": f"{origin} -> {destination}",
            "departure": f"{start_date}T06:00:00Z",
            "arrival": f"{start_date}T12:15:00Z",
            "price": 650.00,
            "cabin": "Premium Economy",
            "duration_minutes": 375,
        },
    ]

    return {"flights": flight_options}
