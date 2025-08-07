/**
 * @fileoverview Enforce iframe elements have a title attribute.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getProp, getPropValue } from "jsx-ast-utils";
import getElementType from "../util/getElementType";
import { generateObjSchema } from "../util/schemas";

const errorMessage = "<iframe> 요소에는 반드시 고유한 title 속성이 있어야 합니다.";

const schema = generateObjSchema();

export default {
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/iframe-has-title.md",
      description: "`<iframe>` 요소에 `title` 속성이 반드시 있어야 합니다.",
    },
    schema: [schema],
  },

  create: (context) => {
    const elementType = getElementType(context);
    return {
      JSXOpeningElement: (node) => {
        const type = elementType(node);

        if (type && type !== "iframe") {
          return;
        }

        const title = getPropValue(getProp(node.attributes, "title"));

        if (title && typeof title === "string") {
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
