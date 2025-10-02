/**
 * Custom ESLint rules for Next.js 15 project
 */

/**
 * Rule: use-client-directive-position
 * Ensures 'use client' directive is at the top of the file (before any imports)
 */
export const useClientDirectivePosition = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Enforce 'use client' directive to be at the top of the file",
      category: "Best Practices",
      recommended: true,
    },
    messages: {
      directiveMustBeFirst:
        "'use client' directive must be at the very top of the file, before any imports or code",
    },
    schema: [],
  },
  create(context) {
    return {
      Program(node) {
        const sourceCode = context.sourceCode || context.getSourceCode();
        const firstToken = sourceCode.getFirstToken(node);
        const comments = sourceCode.getAllComments();

        // Find 'use client' directive
        let useClientDirective = null;
        let useClientIndex = -1;

        for (let i = 0; i < node.body.length; i++) {
          const statement = node.body[i];
          if (
            statement.type === "ExpressionStatement" &&
            statement.expression.type === "Literal" &&
            statement.expression.value === "use client"
          ) {
            useClientDirective = statement;
            useClientIndex = i;
            break;
          }
        }

        // If 'use client' exists, ensure it's first
        if (useClientDirective && useClientIndex > 0) {
          context.report({
            node: useClientDirective,
            messageId: "directiveMustBeFirst",
          });
        }
      },
    };
  },
};