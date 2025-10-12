"""
Transition service for generating intelligent suggestions when switching contexts.

Analyzes incomplete flows and priorities to provide warnings and suggestions.
"""

from datetime import UTC, datetime, timedelta

from src.models.flow import FlowResponse
from src.models.transition import TransitionSuggestions
from src.repositories.context_repository import ContextRepository
from src.repositories.flow_repository import FlowRepository


class TransitionService:
    """
    Service for generating intelligent transition suggestions
    when users switch between contexts.
    """

    def __init__(
        self,
        flow_repository: FlowRepository,
        context_repository: ContextRepository,
    ) -> None:
        """
        Initialize TransitionService.

        Args:
            flow_repository: Repository for flow data access
            context_repository: Repository for context data access
        """
        self.flow_repository = flow_repository
        self.context_repository = context_repository

    async def get_transition_suggestions(
        self,
        from_context_id: str,
        to_context_id: str,
        user_id: str,
    ) -> TransitionSuggestions:
        """
        Generate transition suggestions when switching contexts.

        Args:
            from_context_id: Context user is leaving
            to_context_id: Context user is switching to
            user_id: User making the switch

        Returns:
            TransitionSuggestions with warnings and priorities
        """
        # 1. Fetch incomplete flows from source context
        from_flows_db = await self.flow_repository.get_all_by_context(
            context_id=from_context_id,
            user_id=user_id,
            include_completed=False,
        )
        from_flows = [FlowResponse(**flow.model_dump()) for flow in from_flows_db]

        # 2. Fetch flows from target context
        to_flows_db = await self.flow_repository.get_all_by_context(
            context_id=to_context_id,
            user_id=user_id,
            include_completed=False,
        )
        to_flows = [FlowResponse(**flow.model_dump()) for flow in to_flows_db]

        # 3. Generate warnings about source context
        warnings = self._generate_warnings(from_flows, from_context_id)

        # 4. Identify urgent flows in target context
        urgent_flows = self._identify_urgent_flows(to_flows)

        # 5. Generate suggestions for target context
        suggestions = self._generate_suggestions(to_flows, urgent_flows, to_context_id)

        return TransitionSuggestions(
            from_context=from_context_id,
            to_context=to_context_id,
            warnings=warnings,
            suggestions=suggestions,
            urgent_flows=urgent_flows,
        )

    def _generate_warnings(
        self,
        incomplete_flows: list[FlowResponse],
        context_id: str,  # noqa: ARG002
    ) -> list[str]:
        """
        Generate warning messages about incomplete flows in source context.

        Args:
            incomplete_flows: List of incomplete flows
            context_id: Source context ID

        Returns:
            List of warning messages
        """
        warnings: list[str] = []

        if len(incomplete_flows) == 0:
            return warnings

        # Count high-priority incomplete flows
        high_priority_count = sum(1 for f in incomplete_flows if f.priority == "high")

        # Generate appropriate warning message
        if len(incomplete_flows) == 1:
            warnings.append("You have 1 incomplete flow in this context")
        else:
            warnings.append(f"You have {len(incomplete_flows)} incomplete flows in this context")

        if high_priority_count > 0:
            warnings.append(f"{high_priority_count} of them are high priority")

        return warnings

    def _identify_urgent_flows(
        self,
        flows: list[FlowResponse],
    ) -> list[FlowResponse]:
        """
        Identify urgent flows (due today, overdue, or high priority).

        Args:
            flows: List of flows to analyze

        Returns:
            List of urgent flows sorted by due date
        """
        now = datetime.now(UTC)
        today_end = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)

        urgent: list[FlowResponse] = []

        for flow in flows:
            # Already completed flows are not urgent
            if flow.is_completed:
                continue

            # Check if flow has a due date
            if flow.due_date:
                # due_date is already a datetime object from Pydantic
                due_dt = flow.due_date

                # Urgent if: overdue OR due today OR high priority due soon
                if (
                    due_dt < now
                    or due_dt <= today_end
                    or (flow.priority == "high" and due_dt <= now + timedelta(days=3))
                ):
                    urgent.append(flow)
            # No due date but high priority
            elif flow.priority == "high":
                urgent.append(flow)

        # Sort by due date (overdue first, then soonest)
        urgent.sort(
            key=lambda f: (f.due_date.isoformat() if f.due_date else "9999-12-31T23:59:59Z")
        )

        return urgent

    def _generate_suggestions(
        self,
        incomplete_flows: list[FlowResponse],
        urgent_flows: list[FlowResponse],
        context_id: str,  # noqa: ARG002
    ) -> list[str]:
        """
        Generate actionable suggestions for target context.

        Args:
            incomplete_flows: All incomplete flows in target context
            urgent_flows: Urgent flows in target context
            context_id: Target context ID

        Returns:
            List of suggestion messages
        """
        suggestions: list[str] = []

        # No incomplete flows - positive message
        if len(incomplete_flows) == 0:
            suggestions.append("No pending flows in this context")
            return suggestions

        # Count flows by urgency
        overdue_count = 0
        due_today_count = 0
        now = datetime.now(UTC)
        today_end = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)

        for flow in urgent_flows:
            if flow.due_date:
                # due_date is already a datetime object
                due_dt = flow.due_date
                if due_dt < now:
                    overdue_count += 1
                elif due_dt <= today_end:
                    due_today_count += 1

        # Generate suggestions based on urgency
        if overdue_count > 0:
            plural = "s" if overdue_count > 1 else ""
            suggestions.append(f"{overdue_count} flow{plural} overdue in this context")

        if due_today_count > 0:
            plural = "s" if due_today_count > 1 else ""
            suggestions.append(f"{due_today_count} high-priority flow{plural} due today")

        # If urgent but not overdue/due today, mention priorities
        if len(urgent_flows) > 0 and overdue_count == 0 and due_today_count == 0:
            plural = "s" if len(urgent_flows) > 1 else ""
            msg = f"You have {len(urgent_flows)} high-priority flow{plural}"
            suggestions.append(f"{msg} in this context")

        # Total incomplete flows count
        if len(incomplete_flows) > len(urgent_flows):
            suggestions.append(f"{len(incomplete_flows)} total incomplete flows")

        return suggestions
