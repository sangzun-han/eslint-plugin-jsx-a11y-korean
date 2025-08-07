/**
 * @fileoverview Enforce static elements have no interactive handlers.
 * @author Ethan Cohen
 * @flow
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { dom } from "aria-query";
import { eventHandlersByType, getPropValue, getProp, hasProp } from "jsx-ast-utils";
import type { JSXOpeningElement } from "ast-types-flow";
import type { ESLintConfig, ESLintContext, ESLintVisitorSelectorConfig } from "../../flow/eslint";
import { arraySchema, generateObjSchema } from "../util/schemas";
import getElementType from "../util/getElementType";
import isAbstractRole from "../util/isAbstractRole";
import isHiddenFromScreenReader from "../util/isHiddenFromScreenReader";
import isInteractiveElement from "../util/isInteractiveElement";
import isInteractiveRole from "../util/isInteractiveRole";
import isNonInteractiveElement from "../util/isNonInteractiveElement";
import isNonInteractiveRole from "../util/isNonInteractiveRole";
import isNonLiteralProperty from "../util/isNonLiteralProperty";
import isPresentationRole from "../util/isPresentationRole";

const errorMessage =
  "정적인 요소에 마우스/키보드 이벤트를 사용하지 마세요. 반드시 필요하다면 role 속성 추가 및 키보드/터치/탭 지원을 고려하세요.";

const defaultInteractiveProps = [].concat(
  eventHandlersByType.focus,
  eventHandlersByType.keyboard,
  eventHandlersByType.mouse
);
const schema = generateObjSchema({
  handlers: arraySchema,
});

export default ({
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-static-element-interactions.md",
      description:
        "정적이고 시각적으로 보이는 요소(예: `<div>` 등)에 클릭 핸들러가 있다면 role 속성을 반드시 명시해야 합니다.",
    },
    schema: [schema],
  },

  create: (context: ESLintContext): ESLintVisitorSelectorConfig => {
    const { options } = context;
    const elementType = getElementType(context);
    return {
      JSXOpeningElement: (node: JSXOpeningElement) => {
        const { attributes } = node;
        const type = elementType(node);

        const { allowExpressionValues, handlers = defaultInteractiveProps } = options[0] || {};

        const hasInteractiveProps = handlers.some(
          (prop) => hasProp(attributes, prop) && getPropValue(getProp(attributes, prop)) != null
        );

        if (!dom.has(type)) {
          // Do not test higher level JSX components, as we do not know what
          // low-level DOM element this maps to.
          return;
        }
        if (
          !hasInteractiveProps ||
          isHiddenFromScreenReader(type, attributes) ||
          isPresentationRole(type, attributes)
        ) {
          // Presentation is an intentional signal from the author that this
          // element is not meant to be perceivable. For example, a click screen
          // to close a dialog .
          return;
        }
        if (
          isInteractiveElement(type, attributes) ||
          isInteractiveRole(type, attributes) ||
          isNonInteractiveElement(type, attributes) ||
          isNonInteractiveRole(type, attributes) ||
          isAbstractRole(type, attributes)
        ) {
          // This rule has no opinion about abstract roles.
          return;
        }

        if (allowExpressionValues === true && isNonLiteralProperty(attributes, "role")) {
          // Special case if role is assigned using ternary with literals on both side
          const roleProp = getProp(attributes, "role");
          if (roleProp && roleProp.type === "JSXAttribute" && roleProp.value.type === "JSXExpressionContainer") {
            if (roleProp.value.expression.type === "ConditionalExpression") {
              if (
                roleProp.value.expression.consequent.type === "Literal" &&
                roleProp.value.expression.alternate.type === "Literal"
              ) {
                return;
              }
            }
          }
          return;
        }

        // Visible, non-interactive elements should not have an interactive handler.
        context.report({
          node,
          message: errorMessage,
        });
      },
    };
  },
}: ESLintConfig);
