"""AI Tool definitions and execution for function calling."""

import logging
from collections.abc import Awaitable, Callable
from typing import Any

from src.models.flow import FlowPriority, FlowUpdate
from src.repositories.flow_repository import FlowRepository
from src.services.cache_service import summary_cache

logger = logging.getLogger(__name__)

# Type alias for tool execution functions
ToolExecutor = Callable[[dict[str, Any], str, FlowRepository], Awaitable[dict[str, Any]]]


class AITools:
    """Registry of available AI tools with their schemas and executors."""

    def __init__(self) -> None:
        """Initialize the tools registry."""
        self._tools: dict[str, dict[str, Any]] = {}
        self._executors: dict[str, ToolExecutor] = {}
        self._register_tools()

    def _register_tools(self) -> None:
        """Register all available tools."""
        # Mark flow as complete
        self._tools["mark_flow_complete"] = {
            "type": "function",
            "function": {
                "name": "mark_flow_complete",
                "description": (
                    "Mark a flow (task/todo) as complete. Use this when the user asks to complete, "
                    "finish, mark as done, or check off a task."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "flow_id": {
                            "type": "string",
                            "description": "The ID of the flow to mark as complete",
                        },
                        "reason": {
                            "type": "string",
                            "description": "Optional reason or confirmation message",
                        },
                    },
                    "required": ["flow_id"],
                },
            },
        }
        self._executors["mark_flow_complete"] = self._execute_mark_complete

        # Delete flow
        self._tools["delete_flow"] = {
            "type": "function",
            "function": {
                "name": "delete_flow",
                "description": (
                    "Delete a flow (task/todo) permanently. Use this when the user asks to delete, "
                    "remove, or get rid of a task."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "flow_id": {
                            "type": "string",
                            "description": "The ID of the flow to delete",
                        },
                        "reason": {
                            "type": "string",
                            "description": "Optional reason for deletion",
                        },
                    },
                    "required": ["flow_id"],
                },
            },
        }
        self._executors["delete_flow"] = self._execute_delete

        # Update flow priority
        self._tools["update_flow_priority"] = {
            "type": "function",
            "function": {
                "name": "update_flow_priority",
                "description": (
                    "Update the priority of a flow (task/todo). Use this when the user wants to "
                    "change how important or urgent a task is."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "flow_id": {
                            "type": "string",
                            "description": "The ID of the flow to update",
                        },
                        "priority": {
                            "type": "string",
                            "enum": ["low", "medium", "high"],
                            "description": "The new priority level",
                        },
                    },
                    "required": ["flow_id", "priority"],
                },
            },
        }
        self._executors["update_flow_priority"] = self._execute_update_priority

        # Update flow title/name
        self._tools["update_flow_title"] = {
            "type": "function",
            "function": {
                "name": "update_flow_title",
                "description": (
                    "Update the name/title of a flow (task/todo). Use this when the user wants to "
                    "rename, change the name, or update the title of an existing task."
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "flow_id": {
                            "type": "string",
                            "description": "The ID of the flow to update",
                        },
                        "new_title": {
                            "type": "string",
                            "description": "The new title/name for the flow",
                        },
                    },
                    "required": ["flow_id", "new_title"],
                },
            },
        }
        self._executors["update_flow_title"] = self._execute_update_title

    def get_tool_schemas(self) -> list[dict[str, Any]]:
        """Get all tool schemas in OpenAI function calling format."""
        return list(self._tools.values())

    async def execute_tool(
        self,
        tool_name: str,
        arguments: dict[str, Any],
        user_id: str,
        flow_repo: FlowRepository,
    ) -> dict[str, Any]:
        """
        Execute a tool with the given arguments.

        Args:
            tool_name: Name of the tool to execute
            arguments: Tool arguments (already parsed from JSON)
            user_id: ID of the user executing the tool
            flow_repo: Flow repository for database operations

        Returns:
            Result of the tool execution with success/error status

        """
        if tool_name not in self._executors:
            error_msg = f"Unknown tool: {tool_name}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}

        try:
            executor = self._executors[tool_name]
            result = await executor(arguments, user_id, flow_repo)
            logger.info("Tool %s executed successfully", tool_name)
            return result
        except Exception as e:
            error_msg = f"Tool execution failed: {e!s}"
            logger.exception("Failed to execute tool %s", tool_name)
            return {"success": False, "error": error_msg}

    async def _execute_mark_complete(
        self,
        arguments: dict[str, Any],
        user_id: str,
        flow_repo: FlowRepository,
    ) -> dict[str, Any]:
        """Execute mark_flow_complete tool."""
        flow_id = arguments.get("flow_id")

        if not flow_id:
            logger.error("mark_flow_complete called without flow_id")
            return {
                "success": False,
                "error": "Missing flow_id parameter",
            }

        logger.info("Attempting to mark flow %s as complete for user %s", flow_id, user_id)

        # Get flow to verify ownership and existence
        flow = await flow_repo.get_by_id(flow_id, user_id)
        if not flow:
            logger.warning(
                "Flow %s not found for user %s (already removed or completed)",
                flow_id,
                user_id,
            )
            return {
                "success": True,
                "message": "That task is already cleared",
                "flow_id": flow_id,
            }

        # Mark as complete
        logger.info("Marking flow %s (%s) as complete", flow_id, flow.title)
        updated_flow = await flow_repo.mark_complete(flow_id, user_id)
        if not updated_flow:
            logger.error("Failed to mark flow %s as complete", flow_id)
            return {"success": False, "error": "Failed to mark flow as complete"}

        # Invalidate summary cache for this context
        cache_key = f"summary:{flow.context_id}"
        await summary_cache.delete(cache_key)
        logger.info("Invalidated summary cache for context: %s", flow.context_id)

        logger.info("Successfully marked flow %s as complete", flow_id)
        return {
            "success": True,
            "message": f"Marked '{flow.title}' as complete",
            "flow_id": flow_id,
            "flow_title": flow.title,
        }

    async def _execute_delete(
        self,
        arguments: dict[str, Any],
        user_id: str,
        flow_repo: FlowRepository,
    ) -> dict[str, Any]:
        """Execute delete_flow tool."""
        flow_id = arguments["flow_id"]

        # Get flow to verify ownership and get title before deletion
        flow = await flow_repo.get_by_id(flow_id, user_id)
        if not flow:
            return {
                "success": True,
                "message": "That task was already removed",
                "flow_id": flow_id,
            }

        # Delete the flow
        deleted = await flow_repo.delete(flow_id, user_id)
        if not deleted:
            return {"success": False, "error": "Failed to delete flow"}

        # Invalidate summary cache for this context
        cache_key = f"summary:{flow.context_id}"
        await summary_cache.delete(cache_key)
        logger.info("Invalidated summary cache for context: %s", flow.context_id)

        return {
            "success": True,
            "message": f"Deleted '{flow.title}'",
            "flow_id": flow_id,
            "flow_title": flow.title,
        }

    async def _execute_update_priority(
        self,
        arguments: dict[str, Any],
        user_id: str,
        flow_repo: FlowRepository,
    ) -> dict[str, Any]:
        """Execute update_flow_priority tool."""
        flow_id = arguments["flow_id"]
        priority_str = arguments["priority"]

        # Get flow to verify ownership
        flow = await flow_repo.get_by_id(flow_id, user_id)
        if not flow:
            return {
                "success": True,
                "message": "That task is already gone",
                "flow_id": flow_id,
            }

        # Update priority
        try:
            priority = FlowPriority(priority_str)
            update_data = FlowUpdate(
                title=None,
                description=None,
                priority=priority,
                due_date=None,
                reminder_enabled=None,
            )
            updated_flow = await flow_repo.update(
                flow_id=flow_id,
                user_id=user_id,
                updates=update_data,
            )
            if not updated_flow:
                return {"success": False, "error": "Failed to update flow priority"}

            # Invalidate summary cache for this context
            cache_key = f"summary:{flow.context_id}"
            await summary_cache.delete(cache_key)
            logger.info("Invalidated summary cache for context: %s", flow.context_id)

            return {
                "success": True,
                "message": f"Updated '{flow.title}' priority to {priority_str}",
                "flow_id": flow_id,
                "flow_title": flow.title,
                "new_priority": priority_str,
            }
        except ValueError as e:
            return {"success": False, "error": f"Invalid priority: {e!s}"}

    async def _execute_update_title(
        self,
        arguments: dict[str, Any],
        user_id: str,
        flow_repo: FlowRepository,
    ) -> dict[str, Any]:
        """Execute update_flow_title tool."""
        flow_id = arguments["flow_id"]
        new_title = arguments["new_title"]

        # Get flow to verify ownership and get old title
        flow = await flow_repo.get_by_id(flow_id, user_id)
        if not flow:
            return {
                "success": True,
                "message": "That task is already gone",
                "flow_id": flow_id,
            }

        old_title = flow.title

        # Update title
        try:
            update_data = FlowUpdate(
                title=new_title,
                description=None,
                priority=None,
                due_date=None,
                reminder_enabled=None,
            )
            updated_flow = await flow_repo.update(
                flow_id=flow_id,
                user_id=user_id,
                updates=update_data,
            )
            if not updated_flow:
                return {"success": False, "error": "Failed to update flow title"}

            # Invalidate summary cache for this context
            cache_key = f"summary:{flow.context_id}"
            await summary_cache.delete(cache_key)
            logger.info("Invalidated summary cache for context: %s", flow.context_id)

            return {
                "success": True,
                "message": f"Renamed '{old_title}' to '{new_title}'",
                "flow_id": flow_id,
                "old_title": old_title,
                "new_title": new_title,
            }
        except ValueError as e:
            return {"success": False, "error": f"Invalid title: {e!s}"}


# Global instance
ai_tools = AITools()
