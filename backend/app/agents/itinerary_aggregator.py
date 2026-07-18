from datetime import datetime, timedelta
from .state import TripState


def itinerary_aggregator_node(state: TripState) -> dict:
    flights = state.get("flights", [])
    hotels = state.get("hotels", [])
    activities = state.get("activities", [])
    destination = state.get("destination", "Unknown")
    start_date = state.get("start_date", "")
    end_date = state.get("end_date", "")

    draft = f"# Itinerary: {destination}\n"
    draft += f"**Dates:** {start_date} to {end_date}\n\n"

    draft += "## Logistics & Lodging\n"
    if flights:
        draft += "### Flights\n"
        for f in flights:
            draft += (
                f"- **{f['carrier']} {f['flight_number']}** | "
                f"{f['route']} | ${f['price']:.2f} | "
                f"{f.get('departure', 'TBD')} - {f.get('arrival', 'TBD')}\n"
            )
    else:
        draft += "*No flights booked yet.*\n"

    if hotels:
        draft += "\n### Hotels\n"
        for h in hotels:
            draft += (
                f"- **{h['name']}** - ${h['nightly_rate']:.2f}/night "
                f"(Rating: {h['rating']}) | "
                f"Amenities: {', '.join(h['amenities'])}\n"
            )
    else:
        draft += "*No hotels selected yet.*\n"

    draft += "\n## Daily Schedule\n"
    if activities:
        start = datetime.fromisoformat(start_date) if start_date else datetime.now()
        for idx, act in enumerate(activities):
            day = start + timedelta(days=idx)
            draft += (
                f"\n### Day {idx + 1} - {day.strftime('%A, %B %d, %Y')}\n"
                f"- **{act['title']}**\n"
                f"  - Duration: {act['duration_hours']} hrs | "
                f"Cost: ${act['cost_per_person']:.2f}/person\n"
                f"  - Location: {act.get('location', 'TBD')}\n"
                f"  - {act.get('description', '')}\n"
            )
    else:
        draft += "*No activities planned yet.*\n"

    draft += "\n## Budget Summary\n"
    flight_cost = sum(f.get("price", 0) for f in flights)
    hotel_cost = sum(h.get("total_cost", 0) for h in hotels)
    activity_cost = sum(a.get("cost_per_person", 0) for a in activities)
    total = flight_cost + hotel_cost + activity_cost
    draft += f"- **Flights:** ${flight_cost:.2f}\n"
    draft += f"- **Hotels:** ${hotel_cost:.2f}\n"
    draft += f"- **Activities:** ${activity_cost:.2f}\n"
    draft += f"- **Total Estimated Cost:** ${total:.2f}\n"

    return {"itinerary_draft": draft}
