"""AI Tool definitions and execution for function calling."""

import logging
from collections.abc import Awaitable, Callable
from typing import Any

from src.models.flow import FlowPriority, FlowUpdate
from src.repositories.flow_repository import FlowRepository

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
        flow_id = arguments["flow_id"]

        # Get flow to verify ownership and existence
        flow = await flow_repo.get_by_id(flow_id, user_id)
        if not flow:
            return {
                "success": False,
                "error": f"Flow {flow_id} not found or you don't have access",
            }

        # Mark as complete
        updated_flow = await flow_repo.mark_complete(flow_id, user_id)
        if not updated_flow:
            return {"success": False, "error": "Failed to mark flow as complete"}

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
                "success": False,
                "error": f"Flow {flow_id} not found or you don't have access",
            }

        # Delete the flow
        deleted = await flow_repo.delete(flow_id, user_id)
        if not deleted:
            return {"success": False, "error": "Failed to delete flow"}

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
                "success": False,
                "error": f"Flow {flow_id} not found or you don't have access",
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

            return {
                "success": True,
                "message": f"Updated '{flow.title}' priority to {priority_str}",
                "flow_id": flow_id,
                "flow_title": flow.title,
                "new_priority": priority_str,
            }
        except ValueError as e:
            return {"success": False, "error": f"Invalid priority: {e!s}"}


# Global instance
ai_tools = AITools()
