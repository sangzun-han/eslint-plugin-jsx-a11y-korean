/**
 * @fileoverview Enforce ARIA state and property values are valid.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { aria } from "aria-query";
import { getLiteralPropValue, getPropValue, propName } from "jsx-ast-utils";
import { generateObjSchema } from "../util/schemas";

const errorMessage = (name, type, permittedValues) => {
  switch (type) {
    case "tristate":
      return `${name} 속성 값은 boolean 또는 문자열 "mixed"여야 합니다.`;
    case "token":
      return `${name} 속성 값은 다음 중 하나여야 합니다: ${permittedValues.join(", ")}.`;
    case "tokenlist":
      return `${name} 속성 값은 다음 중 하나 이상의 값으로 이루어진 공백 구분 문자열이어야 합니다: ${permittedValues.join(
        ", "
      )}.`;
    case "idlist":
      return `${name} 속성 값은 DOM 요소 ID를 나타내는 문자열들의 공백 구분 목록이어야 합니다.`;
    case "id":
      return `${name} 속성 값은 DOM 요소 ID를 나타내는 문자열이어야 합니다.`;
    case "boolean":
    case "string":
    case "integer":
    case "number":
    default:
      return `${name} 속성 값은 ${type} 타입이어야 합니다.`;
  }
};

const validityCheck = (value, expectedType, permittedValues) => {
  switch (expectedType) {
    case "boolean":
      return typeof value === "boolean";
    case "string":
    case "id":
      return typeof value === "string";
    case "tristate":
      return typeof value === "boolean" || value === "mixed";
    case "integer":
    case "number":
      // Booleans resolve to 0/1 values so hard check that it's not first.
      // eslint-disable-next-line no-restricted-globals
      return typeof value !== "boolean" && isNaN(Number(value)) === false;
    case "token":
      return permittedValues.indexOf(typeof value === "string" ? value.toLowerCase() : value) > -1;
    case "idlist":
      return typeof value === "string" && value.split(" ").every((token) => validityCheck(token, "id", []));
    case "tokenlist":
      return (
        typeof value === "string" &&
        value.split(" ").every((token) => permittedValues.indexOf(token.toLowerCase()) > -1)
      );
    default:
      return false;
  }
};

const schema = generateObjSchema();

export default {
  validityCheck,
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/aria-proptypes.md",
      description: "ARIA 상태 및 속성 값이 명세에 맞는지 검사합니다.",
    },
    schema: [schema],
  },

  create: (context) => ({
    JSXAttribute: (attribute) => {
      const name = propName(attribute);
      const normalizedName = name.toLowerCase();

      // Not a valid aria-* state or property.
      if (normalizedName.indexOf("aria-") !== 0 || aria.get(normalizedName) === undefined) {
        return;
      }

      // Ignore the attribute if its value is null or undefined.
      if (getPropValue(attribute) == null) return;

      const value = getLiteralPropValue(attribute);

      // Ignore the attribute if its value is not a literal.
      if (value === null) {
        return;
      }

      // These are the attributes of the property/state to check against.
      const attributes = aria.get(normalizedName);
      const permittedType = attributes.type;
      const allowUndefined = attributes.allowUndefined || false;
      const permittedValues = attributes.values || [];

      const isValid = validityCheck(value, permittedType, permittedValues) || (allowUndefined && value === undefined);

      if (isValid) {
        return;
      }

      context.report({
        node: attribute,
        message: errorMessage(name, permittedType, permittedValues),
      });
    },
  }),
};
