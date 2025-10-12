"""
Transition suggestion models for context switching intelligence.

Provides warnings about incomplete flows and suggests priorities
when users switch between contexts.
"""

from pydantic import BaseModel, Field

from src.models.flow import FlowResponse


class TransitionSuggestions(BaseModel):
    """
    Intelligent suggestions when users switch contexts.

    Provides warnings about incomplete flows and suggests priorities
    in the target context.
    """

    from_context: str = Field(description="Context ID user is leaving")
    to_context: str = Field(description="Context ID user is switching to")
    warnings: list[str] = Field(
        default_factory=list,
        description="Warning messages about incomplete flows in source context",
    )
    suggestions: list[str] = Field(
        default_factory=list,
        description="Actionable suggestions for target context",
    )
    urgent_flows: list[FlowResponse] = Field(
        default_factory=list,
        description="High-priority flows due soon or overdue in target context",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "from_context": "ctx-work-123",
                "to_context": "ctx-personal-456",
                "warnings": ["You have 3 incomplete flows in Work context"],
                "suggestions": [
                    "You have 2 high-priority flows due today in Personal context",
                    "1 flow is overdue in Personal context",
                ],
                "urgent_flows": [
                    {
                        "id": "flow-urgent-1",
                        "title": "Review Q4 budget",
                        "priority": "high",
                        "due_date": "2025-01-12T17:00:00Z",
                        "is_completed": False,
                    }
                ],
            }
        }
    }
