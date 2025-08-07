/**
 * @fileoverview Enforce scope prop is only used on <th> elements.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { dom } from "aria-query";
import { propName } from "jsx-ast-utils";
import { generateObjSchema } from "../util/schemas";
import getElementType from "../util/getElementType";

const errorMessage = "`scope` 속성은 오직 `<th>` 요소에서만 사용할 수 있습니다.";

const schema = generateObjSchema();

export default {
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/scope.md",
      description: "`<scope>` 속성은 오직 `<th>` 요소에서만 사용할 수 있도록 강제합니다.",
    },
    schema: [schema],
  },

  create: (context) => {
    const elementType = getElementType(context);
    return {
      JSXAttribute: (node) => {
        const name = propName(node);
        if (name && name.toUpperCase() !== "SCOPE") {
          return;
        }

        const { parent } = node;
        const tagName = elementType(parent);

        // Do not test higher level JSX components, as we do not know what
        // low-level DOM element this maps to.
        if (!dom.has(tagName)) {
          return;
        }
        if (tagName && tagName.toUpperCase() === "TH") {
          return;
        }

        context.report({
          node,
          message: errorMessage,
        });
      },
    };
  },
};
