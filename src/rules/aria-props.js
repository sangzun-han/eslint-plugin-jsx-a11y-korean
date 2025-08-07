/**
 * @fileoverview Enforce all aria-* properties are valid.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { aria } from "aria-query";
import { propName } from "jsx-ast-utils";
import { generateObjSchema } from "../util/schemas";
import getSuggestion from "../util/getSuggestion";

const ariaAttributes = aria.keys();

const errorMessage = (name) => {
  const suggestions = getSuggestion(name, ariaAttributes);
  const message = `${name}: 이 속성은 유효하지 않은 ARIA 속성입니다.`;

  if (suggestions.length > 0) {
    return `${message} 혹시 ${suggestions} 를(을) 사용하려던 건가요?`;
  }

  return message;
};

const schema = generateObjSchema();

export default {
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/aria-props.md",
      description: "`aria-*` 속성들이 모두 유효한지 검사합니다.",
    },
    schema: [schema],
  },

  create: (context) => ({
    JSXAttribute: (attribute) => {
      const name = propName(attribute);

      // `aria` needs to be prefix of property.
      if (name.indexOf("aria-") !== 0) {
        return;
      }

      const isValid = aria.has(name);

      if (isValid === false) {
        context.report({
          node: attribute,
          message: errorMessage(name),
        });
      }
    },
  }),
};
