/**
 * @fileoverview Enforce distracting elements are not used.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { generateObjSchema, enumArraySchema } from "../util/schemas";
import getElementType from "../util/getElementType";

const errorMessage = (element) =>
  `<${element}> 요소는 시각적 접근성에 문제가 있으며, 사용이 권장되지 않습니다. 사용하지 마세요.`;

const DEFAULT_ELEMENTS = ["marquee", "blink"];

const schema = generateObjSchema({
  elements: enumArraySchema(DEFAULT_ELEMENTS),
});

export default {
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-distracting-elements.md",
      description: "시각적으로 산만한 요소(`<marquee>`, `<blink>` 등)의 사용을 금지합니다.",
    },
    schema: [schema],
  },

  create: (context) => {
    const elementType = getElementType(context);
    return {
      JSXOpeningElement: (node) => {
        const options = context.options[0] || {};
        const elementOptions = options.elements || DEFAULT_ELEMENTS;
        const type = elementType(node);
        const distractingElement = elementOptions.find((element) => type === element);

        if (distractingElement) {
          context.report({
            node,
            message: errorMessage(distractingElement),
          });
        }
      },
    };
  },
};
