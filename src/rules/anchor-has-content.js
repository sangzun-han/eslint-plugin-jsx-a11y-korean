/**
 * @fileoverview Enforce anchor elements to contain accessible content.
 * @author Lisa Ring & Niklas Holmberg
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { hasAnyProp } from "jsx-ast-utils";

import getElementType from "../util/getElementType";
import { arraySchema, generateObjSchema } from "../util/schemas";
import hasAccessibleChild from "../util/hasAccessibleChild";

const errorMessage =
  "앵커(<a>) 요소는 반드시 콘텐츠를 포함해야 하며, 해당 콘텐츠는 스크린 리더가 접근 가능해야 합니다.";

const schema = generateObjSchema({ components: arraySchema });

export default {
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/anchor-has-content.md",
      description: "모든 앵커 요소가 접근 가능한 콘텐츠를 포함하도록 강제합니다.",
    },
    schema: [schema],
  },

  create: (context) => {
    const elementType = getElementType(context);
    return {
      JSXOpeningElement: (node) => {
        const options = context.options[0] || {};
        const componentOptions = options.components || [];
        const typeCheck = ["a"].concat(componentOptions);
        const nodeType = elementType(node);

        // Only check anchor elements and custom types.
        if (typeCheck.indexOf(nodeType) === -1) {
          return;
        }
        if (hasAccessibleChild(node.parent, elementType)) {
          return;
        }
        if (hasAnyProp(node.attributes, ["title", "aria-label"])) {
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
