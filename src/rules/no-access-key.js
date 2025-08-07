/**
 * @fileoverview Enforce no accesskey attribute on element.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getProp, getPropValue } from "jsx-ast-utils";
import { generateObjSchema } from "../util/schemas";

const errorMessage =
  "`accessKey` 속성은 사용할 수 없습니다. 키보드 단축키와 스크린 리더 간의 충돌로 접근성 문제가 발생할 수 있습니다.";

const schema = generateObjSchema();

export default {
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-access-key.md",
      description:
        "`accessKey` 속성을 어떤 요소에도 사용하지 않도록 강제합니다. 이 속성은 스크린 리더나 키보드 사용자에게 예기치 않은 충돌을 야기할 수 있기 때문입니다.",
    },
    schema: [schema],
  },

  create: (context) => ({
    JSXOpeningElement: (node) => {
      const accessKey = getProp(node.attributes, "accesskey");
      const accessKeyValue = getPropValue(accessKey);

      if (accessKey && accessKeyValue) {
        context.report({
          node,
          message: errorMessage,
        });
      }
    },
  }),
};
