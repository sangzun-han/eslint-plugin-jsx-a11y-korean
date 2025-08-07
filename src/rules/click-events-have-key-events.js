/**
 * @fileoverview Enforce a clickable non-interactive element has at least 1 keyboard event listener.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { dom } from "aria-query";
import { getProp, hasAnyProp } from "jsx-ast-utils";
import { generateObjSchema } from "../util/schemas";
import getElementType from "../util/getElementType";
import isHiddenFromScreenReader from "../util/isHiddenFromScreenReader";
import isInteractiveElement from "../util/isInteractiveElement";
import isPresentationRole from "../util/isPresentationRole";

const errorMessage =
  "보이는 비인터랙티브 요소에 클릭 핸들러가 있을 경우, 최소한 하나의 키보드 이벤트 리스너가 필요합니다.";

const schema = generateObjSchema();

export default {
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/click-events-have-key-events.md",
      description: "클릭 가능한 비인터랙티브 요소에는 최소한 하나의 키보드 이벤트 리스너가 있어야 합니다.",
    },
    schema: [schema],
  },

  create: (context) => {
    const elementType = getElementType(context);
    return {
      JSXOpeningElement: (node) => {
        const props = node.attributes;
        if (getProp(props, "onclick") === undefined) {
          return;
        }

        const type = elementType(node);
        const requiredProps = ["onkeydown", "onkeyup", "onkeypress"];

        if (!dom.has(type)) {
          // Do not test higher level JSX components, as we do not know what
          // low-level DOM element this maps to.
          return;
        }
        if (isHiddenFromScreenReader(type, props) || isPresentationRole(type, props)) {
          return;
        }
        if (isInteractiveElement(type, props)) {
          return;
        }
        if (hasAnyProp(props, requiredProps)) {
          return;
        }

        // Visible, non-interactive elements with click handlers require one keyboard event listener.
        context.report({
          node,
          message: errorMessage,
        });
      },
    };
  },
};
