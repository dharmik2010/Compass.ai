from .state import TripState


def validation_gate_node(state: TripState) -> dict:
    budget = state.get("budget", 0.0)

    flight_cost = sum(f.get("price", 0) for f in state.get("flights", []))
    hotel_cost = sum(h.get("total_cost", 0) for h in state.get("hotels", []))
    activity_cost = sum(a.get("cost_per_person", 0) for a in state.get("activities", []))
    total_cost = flight_cost + hotel_cost + activity_cost

    errors = []

    if budget > 0 and total_cost > budget:
        errors.append(
            f"Projected cost (${total_cost:.2f}) exceeds budget of ${budget:.2f} "
            f"by ${total_cost - budget:.2f}"
        )

    if not state.get("flights"):
        errors.append("No flight options available for the selected route.")

    if not state.get("hotels"):
        errors.append("No hotel options available within budget constraints.")

    if not state.get("activities"):
        errors.append("No activities matched your interests.")

    approved = len(errors) == 0

    result = {"approved": approved}
    if errors:
        result["errors"] = errors

    return result


def evaluate_validation_route(state: TripState) -> str:
    if state.get("approved") is False:
        return "supervisor_agent"
    return "__end__"
