/**
 * @fileoverview Enforce img alt attribute does not have the word image, picture, or photo.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getProp, getLiteralPropValue } from "jsx-ast-utils";
import includes from "array-includes";
import stringIncludes from "string.prototype.includes";
import safeRegexTest from "safe-regex-test";
import { generateObjSchema, arraySchema } from "../util/schemas";
import getElementType from "../util/getElementType";
import isHiddenFromScreenReader from "../util/isHiddenFromScreenReader";

const REDUNDANT_WORDS = ["image", "photo", "picture"];

const errorMessage =
  'alt 속성에 "image", "photo", "picture"와 같은 단어는 불필요합니다. 스크린 리더는 이미 이미지를 인식합니다.';

const schema = generateObjSchema({
  components: arraySchema,
  words: arraySchema,
});

const isASCII = safeRegexTest(/[\x20-\x7F]+/);

function containsRedundantWord(value, redundantWords) {
  const lowercaseRedundantWords = redundantWords.map((redundantWord) => redundantWord.toLowerCase());

  if (isASCII(value)) {
    return value.split(/\s+/).some((valueWord) => includes(lowercaseRedundantWords, valueWord.toLowerCase()));
  }
  return lowercaseRedundantWords.some((redundantWord) => stringIncludes(value.toLowerCase(), redundantWord));
}

export default {
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/img-redundant-alt.md",
      description: "`<img>` 태그의 `alt` 속성에 중복된 단어가 포함되지 않도록 합니다.",
    },
    schema: [schema],
  },

  create: (context) => {
    const elementType = getElementType(context);
    return {
      JSXOpeningElement: (node) => {
        const options = context.options[0] || {};
        const componentOptions = options.components || [];
        const typesToValidate = ["img"].concat(componentOptions);
        const nodeType = elementType(node);

        // Only check 'label' elements and custom types.
        if (typesToValidate.indexOf(nodeType) === -1) {
          return;
        }

        const altProp = getProp(node.attributes, "alt");
        // Return if alt prop is not present.
        if (altProp === undefined) {
          return;
        }

        const value = getLiteralPropValue(altProp);
        const isVisible = isHiddenFromScreenReader(nodeType, node.attributes) === false;

        const { words = [] } = options;
        const redundantWords = REDUNDANT_WORDS.concat(words);

        if (typeof value === "string" && isVisible) {
          const hasRedundancy = containsRedundantWord(value, redundantWords);

          if (hasRedundancy === true) {
            context.report({
              node,
              message: errorMessage,
            });
          }
        }
      },
    };
  },
};
