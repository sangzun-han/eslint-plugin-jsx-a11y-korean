/**
 * @fileoverview Enforce tabIndex value is not greater than zero.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getLiteralPropValue, propName } from "jsx-ast-utils";
import { generateObjSchema } from "../util/schemas";

const errorMessage = "tabIndex에 양의 정수를 사용하는 것은 피해야 합니다.";

const schema = generateObjSchema();

export default {
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/tabindex-no-positive.md",
      description: "`tabIndex` 값이 0보다 크지 않도록 강제합니다.",
    },
    schema: [schema],
  },

  create: (context) => ({
    JSXAttribute: (attribute) => {
      const name = propName(attribute).toUpperCase();

      // Check if tabIndex is the attribute
      if (name !== "TABINDEX") {
        return;
      }

      // Only check literals because we can't infer values from certain expressions.
      const value = Number(getLiteralPropValue(attribute));

      // eslint-disable-next-line no-restricted-globals
      if (isNaN(value) || value <= 0) {
        return;
      }

      context.report({
        node: attribute,
        message: errorMessage,
      });
    },
  }),
};
