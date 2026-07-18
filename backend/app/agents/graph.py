from typing import List, Dict, Any
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Send

from .state import TripState
from .supervisor import supervisor_node
from .flight_agent import flight_planner_agent
from .hotel_agent import hotel_planner_agent
from .activity_agent import activity_planner_agent
from .itinerary_aggregator import itinerary_aggregator_node
from .validation_gate import validation_gate_node, evaluate_validation_route
from .packing_agent import packing_agent
from .sentinel_agent import sentinel_agent
from .tradeoff_agent import tradeoff_decision_agent


def initiate_parallel_workers(state: TripState) -> List[Send]:
    return [
        Send("flight_planner", state),
        Send("hotel_planner", state),
        Send("activity_planner", state),
    ]


def build_travel_planner_graph() -> StateGraph:
    workflow = StateGraph(TripState)

    workflow.add_node("supervisor_agent", supervisor_node)
    workflow.add_node("flight_planner", flight_planner_agent)
    workflow.add_node("hotel_planner", hotel_planner_agent)
    workflow.add_node("activity_planner", activity_planner_agent)
    workflow.add_node("itinerary_aggregator", itinerary_aggregator_node)
    workflow.add_node("validation_gate", validation_gate_node)
    workflow.add_node("packing_agent", packing_agent)
    workflow.add_node("sentinel_agent", sentinel_agent)
    workflow.add_node("tradeoff_agent", tradeoff_decision_agent)

    workflow.set_entry_point("supervisor_agent")

    workflow.add_conditional_edges(
        "supervisor_agent",
        initiate_parallel_workers,
        ["flight_planner", "hotel_planner", "activity_planner"],
    )

    workflow.add_edge("flight_planner", "itinerary_aggregator")
    workflow.add_edge("hotel_planner", "itinerary_aggregator")
    workflow.add_edge("activity_planner", "itinerary_aggregator")

    workflow.add_edge("itinerary_aggregator", "validation_gate")

    workflow.add_conditional_edges(
        "validation_gate",
        evaluate_validation_route,
        {
            "supervisor_agent": "supervisor_agent",
            END: "tradeoff_agent",
        },
    )

    workflow.add_edge("tradeoff_agent", "packing_agent")
    workflow.add_edge("packing_agent", "sentinel_agent")
    workflow.add_edge("sentinel_agent", END)

    memory_saver = MemorySaver()

    compiled = workflow.compile(
        checkpointer=memory_saver,
        interrupt_before=["validation_gate"],
    )

    return compiled


travel_planner = build_travel_planner_graph()
