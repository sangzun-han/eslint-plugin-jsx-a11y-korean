/**
 * @fileoverview Enforce html element has lang prop.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getProp, getPropValue } from "jsx-ast-utils";
import { generateObjSchema } from "../util/schemas";
import getElementType from "../util/getElementType";

const errorMessage = "<html> 요소에는 반드시 lang 속성이 있어야 합니다.";

const schema = generateObjSchema();

export default {
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/html-has-lang.md",
      description: "`<html>` 요소가 `lang` 속성을 포함하도록 강제합니다.",
    },
    schema: [schema],
  },

  create: (context) => {
    const elementType = getElementType(context);
    return {
      JSXOpeningElement: (node) => {
        const type = elementType(node);

        if (type && type !== "html") {
          return;
        }

        const lang = getPropValue(getProp(node.attributes, "lang"));

        if (lang) {
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
