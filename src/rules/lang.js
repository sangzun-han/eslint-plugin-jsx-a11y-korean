/**
 * @fileoverview Enforce lang attribute has a valid value.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { propName, getLiteralPropValue } from "jsx-ast-utils";
import tags from "language-tags";
import { generateObjSchema } from "../util/schemas";
import getElementType from "../util/getElementType";

const errorMessage = "`lang` 속성은 유효한 언어 코드여야 합니다.";

const schema = generateObjSchema();

export default {
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/lang.md",
      description: "`lang` 속성은 올바른 언어 코드 값을 가져야 합니다.",
    },
    schema: [schema],
  },

  create: (context) => {
    const elementType = getElementType(context);
    return {
      JSXAttribute: (node) => {
        const name = propName(node);
        if (name && name.toUpperCase() !== "LANG") {
          return;
        }

        const { parent } = node;
        const type = elementType(parent);
        if (type && type !== "html") {
          return;
        }

        const value = getLiteralPropValue(node);

        // Don't check identifiers
        if (value === null) {
          return;
        }
        if (value === undefined) {
          context.report({
            node,
            message: errorMessage,
          });

          return;
        }

        if (tags.check(value)) {
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
