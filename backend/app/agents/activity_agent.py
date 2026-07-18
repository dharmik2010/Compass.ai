from .state import TripState


def activity_planner_agent(state: TripState) -> dict:
    destination = state.get("destination", "")
    interests = state.get("interests", [])

    activity_options = [
        {
            "title": f"Private Historical Architecture Tour in {destination}",
            "tags": ["history", "architecture"],
            "duration_hours": 3.0,
            "cost_per_person": 55.00,
            "location": "Historic Center",
            "description": "Guided walking tour through the historic district with an expert local historian.",
        },
        {
            "title": f"Culinary Food Walking Tour in {destination}",
            "tags": ["food", "culture"],
            "duration_hours": 4.0,
            "cost_per_person": 85.00,
            "location": "Downtown",
            "description": "Sample local cuisine across 5 family-owned restaurants and street food vendors.",
        },
        {
            "title": f"Outdoor Adventure Hike in {destination}",
            "tags": ["nature", "adventure", "outdoor"],
            "duration_hours": 5.0,
            "cost_per_person": 45.00,
            "location": "National Park",
            "description": "Guided hike through scenic trails with panoramic viewpoints.",
        },
        {
            "title": f"Museum Pass - Top 3 Museums in {destination}",
            "tags": ["art", "history", "culture"],
            "duration_hours": 6.0,
            "cost_per_person": 40.00,
            "location": "Museum District",
            "description": "Skip-the-line access to the three most acclaimed museums.",
        },
    ]

    scored = []
    for activity in activity_options:
        relevance = len(set(activity["tags"]) & set(interests))
        scored.append((relevance, activity))

    scored.sort(key=lambda x: x[0], reverse=True)

    return {"activities": [act for _, act in scored]}
