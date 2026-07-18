from .state import TripState


def tradeoff_decision_agent(state: TripState) -> dict:
    flights = state.get("flights", [])
    budget = state.get("budget", 0.0)

    scored_scenarios = []

    for flight in flights:
        flight_cost = flight.get("price", 0)
        duration = flight.get("duration_minutes", 300)
        cabin = flight.get("cabin", "Economy")

        cost_score = max(0, 1.0 - (flight_cost / max(budget, 1)))
        time_score = max(0, 1.0 - (duration / 600))
        comfort_score = 0.5 if cabin == "Economy" else (0.8 if "Premium" in cabin else 1.0)

        overall = (cost_score * 0.4 + time_score * 0.35 + comfort_score * 0.25)

        scored_scenarios.append({
            "flight": f"{flight['carrier']} {flight['flight_number']}",
            "price": flight_cost,
            "duration_minutes": duration,
            "cabin": cabin,
            "scores": {
                "cost_efficiency": round(cost_score * 10, 1),
                "time_efficiency": round(time_score * 10, 1),
                "comfort": round(comfort_score * 10, 1),
                "overall": round(overall * 10, 1),
            },
        })

    scored_scenarios.sort(key=lambda x: x["scores"]["overall"], reverse=True)

    for i, scenario in enumerate(scored_scenarios):
        if i == 0:
            scenario["recommendation"] = "Best Overall Value"
        else:
            is_cheapest = scenario["price"] == min(s["price"] for s in scored_scenarios)
            is_fastest = scenario["duration_minutes"] == min(s["duration_minutes"] for s in scored_scenarios)
            if is_cheapest:
                scenario["recommendation"] = "Cheapest Option"
            elif is_fastest:
                scenario["recommendation"] = "Fastest Option"
            else:
                scenario["recommendation"] = "Alternative"

    trade_off_summary = {
        "scenarios": scored_scenarios,
        "comparison_advice": [],
    }

    if len(scored_scenarios) >= 2:
        cheapest = min(scored_scenarios, key=lambda x: x["price"])
        fastest = min(scored_scenarios, key=lambda x: x["duration_minutes"])
        if cheapest["flight"] != fastest["flight"]:
            trade_off_summary["comparison_advice"].append(
                f"Cheapest: {cheapest['flight']} (${cheapest['price']:.2f}) vs "
                f"Fastest: {fastest['flight']} ({fastest['duration_minutes']} min) - "
                f"Save ${abs(cheapest['price'] - fastest['price']):.2f} but add "
                f"{abs(cheapest['duration_minutes'] - fastest['duration_minutes'])} min travel."
            )

    return {"trade_off_scores": trade_off_summary}
