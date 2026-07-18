from langchain_core.messages import AIMessage
from .state import TripState


def supervisor_node(state: TripState) -> dict:
    return {
        "messages": [
            AIMessage(
                content=(
                    f"Planning trip to {state.get('destination', 'unknown')} "
                    f"from {state.get('origin', 'unknown')} "
                    f"({state.get('start_date', 'TBD')} - {state.get('end_date', 'TBD')}) "
                    f"with budget ${state.get('budget', 0):.2f}. "
                    f"Interests: {', '.join(state.get('interests', []))}. "
                    "Initiating parallel agent planning cycle."
                )
            )
        ]
    }
