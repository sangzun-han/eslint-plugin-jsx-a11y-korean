/**
 * @fileoverview Enforce label tags have an associated control.
 * @author Jesse Beach
 *
 * @flow
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { hasProp, getProp, getPropValue } from "jsx-ast-utils";
import type { JSXElement } from "ast-types-flow";
import minimatch from "minimatch";
import { generateObjSchema, arraySchema } from "../util/schemas";
import type { ESLintConfig, ESLintContext, ESLintVisitorSelectorConfig } from "../../flow/eslint";
import getElementType from "../util/getElementType";
import mayContainChildComponent from "../util/mayContainChildComponent";
import mayHaveAccessibleLabel from "../util/mayHaveAccessibleLabel";

const errorMessages = {
  accessibleLabel: "폼 레이블에는 접근 가능한 텍스트가 포함되어야 합니다.",
  htmlFor: "폼 레이블은 유효한 htmlFor 속성을 가져야 합니다.",
  nesting: "폼 레이블은 내부에 연결된 폼 컨트롤을 자식으로 포함해야 합니다.",
  either: "폼 레이블은 htmlFor 속성 또는 자식 폼 컨트롤 중 하나를 가져야 합니다.",
  both: "폼 레이블은 htmlFor 속성과 자식 폼 컨트롤 둘 다 가져야 합니다.",
};

const schema = generateObjSchema({
  labelComponents: arraySchema,
  labelAttributes: arraySchema,
  controlComponents: arraySchema,
  assert: {
    description: "htmlFor, nesting, both, either 중 어떤 연결 방식을 검사할지 지정",
    type: "string",
    enum: ["htmlFor", "nesting", "both", "either"],
  },
  depth: {
    description: "접근 가능한 label 검색 깊이 제한",
    type: "integer",
    minimum: 0,
  },
});

const validateHtmlFor = (node, context) => {
  const { settings } = context;
  const htmlForAttributes = settings["jsx-a11y"]?.attributes?.for ?? ["htmlFor"];

  for (let i = 0; i < htmlForAttributes.length; i += 1) {
    const attribute = htmlForAttributes[i];
    if (hasProp(node.attributes, attribute)) {
      const htmlForAttr = getProp(node.attributes, attribute);
      const htmlForValue = getPropValue(htmlForAttr);

      return htmlForAttr !== false && !!htmlForValue;
    }
  }

  return false;
};

export default ({
  meta: {
    docs: {
      description: "`<label>` 태그에 접근 가능한 텍스트와 연결된 폼 컨트롤이 있어야 합니다.",
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/main/docs/rules/label-has-associated-control.md",
    },
    schema: [schema],
  },

  create: (context: ESLintContext): ESLintVisitorSelectorConfig => {
    const options = context.options[0] || {};
    const labelComponents = options.labelComponents || [];
    const assertType = options.assert || "either";
    const labelComponentNames = ["label"].concat(labelComponents);
    const elementType = getElementType(context);

    const rule = (node: JSXElement) => {
      const isLabelComponent = labelComponentNames.some((name) => minimatch(elementType(node.openingElement), name));
      if (!isLabelComponent) {
        return;
      }

      const controlComponents = [].concat(
        "input",
        "meter",
        "output",
        "progress",
        "select",
        "textarea",
        options.controlComponents || []
      );
      // Prevent crazy recursion.
      const recursionDepth = Math.min(options.depth === undefined ? 2 : options.depth, 25);
      const hasHtmlFor = validateHtmlFor(node.openingElement, context);
      // Check for multiple control components.
      const hasNestedControl = controlComponents.some((name) =>
        mayContainChildComponent(node, name, recursionDepth, elementType)
      );
      const hasAccessibleLabel = mayHaveAccessibleLabel(
        node,
        recursionDepth,
        options.labelAttributes,
        elementType,
        controlComponents
      );

      // Bail out immediately if we don't have an accessible label.
      if (!hasAccessibleLabel) {
        context.report({
          node: node.openingElement,
          message: errorMessages.accessibleLabel,
        });
        return;
      }
      switch (assertType) {
        case "htmlFor":
          if (!hasHtmlFor) {
            context.report({
              node: node.openingElement,
              message: errorMessages.htmlFor,
            });
          }
          break;
        case "nesting":
          if (!hasNestedControl) {
            context.report({
              node: node.openingElement,
              message: errorMessages.nesting,
            });
          }
          break;
        case "both":
          if (!hasHtmlFor || !hasNestedControl) {
            context.report({
              node: node.openingElement,
              message: errorMessages.both,
            });
          }
          break;
        case "either":
          if (!hasHtmlFor && !hasNestedControl) {
            context.report({
              node: node.openingElement,
              message: errorMessages.either,
            });
          }
          break;
        default:
          break;
      }
    };

    // Create visitor selectors.
    return {
      JSXElement: rule,
    };
  },
}: ESLintConfig);
