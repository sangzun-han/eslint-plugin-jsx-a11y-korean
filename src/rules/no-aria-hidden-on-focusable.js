/**
 * @fileoverview Enforce aria-hidden is not used on interactive elements or contain interactive elements.
 * @author Kate Higa
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getProp, getPropValue } from "jsx-ast-utils";
import getElementType from "../util/getElementType";
import isFocusable from "../util/isFocusable";
import { generateObjSchema } from "../util/schemas";

const schema = generateObjSchema();

export default {
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-aria-hidden-on-focusable.md",
      description: 'aria-hidden="true" 속성이 포커스 가능한(focusable) 요소에 설정되지 않도록 강제합니다.',
    },
    schema: [schema],
  },

  create(context) {
    const elementType = getElementType(context);
    return {
      JSXOpeningElement(node) {
        const { attributes } = node;
        const type = elementType(node);
        const isAriaHidden = getPropValue(getProp(attributes, "aria-hidden")) === true;

        if (isAriaHidden && isFocusable(type, attributes)) {
          context.report({
            node,
            message: 'aria-hidden="true"는 포커스 가능한 요소에 설정할 수 없습니다.',
          });
        }
      },
    };
  },
};
