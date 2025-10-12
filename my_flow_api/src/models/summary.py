"""Context summary models for AI-powered summaries."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from src.models.flow import FlowResponse


class ContextSummary(BaseModel):
    """AI-generated summary of a context's status and progress.

    This model provides an overview of incomplete and completed flows,
    along with an AI-generated natural language summary and top priorities.
    Used for context switching transitions to give users quick status updates.
    """

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "context_id": "507f1f77bcf86cd799439011",
                "incomplete_flows_count": 3,
                "completed_flows_count": 7,
                "summary_text": (
                    "You have 3 incomplete flows in your Work context. "
                    "Last activity was 2 hours ago when you discussed "
                    "the Q4 roadmap."
                ),
                "last_activity": "2025-01-12T14:30:00Z",
                "top_priorities": [],
            }
        }
    )

    context_id: str = Field(..., description="Context identifier")
    incomplete_flows_count: int = Field(0, description="Count of incomplete flows")
    completed_flows_count: int = Field(0, description="Count of completed flows")
    summary_text: str = Field(..., description="AI-generated natural language summary")
    last_activity: datetime | None = Field(None, description="Most recent activity timestamp")
    top_priorities: list[FlowResponse] = Field(
        default_factory=list, description="Top 3 high-priority incomplete flows"
    )
