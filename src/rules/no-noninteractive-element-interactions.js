/**
 * @fileoverview Enforce non-interactive elements have no interactive handlers.
 * @author Jese Beach
 * @flow
 */
// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { dom } from "aria-query";
import { eventHandlersByType, getPropValue, getProp, hasProp, propName } from "jsx-ast-utils";
import type { JSXOpeningElement } from "ast-types-flow";
import includes from "array-includes";
import hasOwn from "hasown";
import type { ESLintConfig, ESLintContext, ESLintVisitorSelectorConfig } from "../../flow/eslint";
import { arraySchema, generateObjSchema } from "../util/schemas";
import getElementType from "../util/getElementType";
import isAbstractRole from "../util/isAbstractRole";
import isContentEditable from "../util/isContentEditable";
import isHiddenFromScreenReader from "../util/isHiddenFromScreenReader";
import isInteractiveElement from "../util/isInteractiveElement";
import isInteractiveRole from "../util/isInteractiveRole";
import isNonInteractiveElement from "../util/isNonInteractiveElement";
import isNonInteractiveRole from "../util/isNonInteractiveRole";
import isPresentationRole from "../util/isPresentationRole";

const errorMessage = "비인터랙티브 요소에는 마우스나 키보드 이벤트 핸들러를 사용할 수 없습니다.";

const defaultInteractiveProps = [].concat(
  eventHandlersByType.focus,
  eventHandlersByType.image,
  eventHandlersByType.keyboard,
  eventHandlersByType.mouse
);
const schema = generateObjSchema({
  handlers: arraySchema,
});

export default ({
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-noninteractive-element-interactions.md",
      description: "비인터랙티브 요소에 마우스 또는 키보드 이벤트 핸들러를 부착하는 것을 방지합니다.",
    },
    schema: [schema],
  },

  create: (context: ESLintContext): ESLintVisitorSelectorConfig => {
    const { options } = context;
    const elementType = getElementType(context);
    return {
      JSXOpeningElement: (node: JSXOpeningElement) => {
        let { attributes } = node;
        const type = elementType(node);
        const config = options[0] || {};
        const interactiveProps = config.handlers || defaultInteractiveProps;
        // Allow overrides from rule configuration for specific elements and roles.
        if (hasOwn(config, type)) {
          attributes = attributes.filter(
            (attr) => attr.type !== "JSXSpreadAttribute" && !includes(config[type], propName(attr))
          );
        }

        const hasInteractiveProps = interactiveProps.some(
          (prop) => hasProp(attributes, prop) && getPropValue(getProp(attributes, prop)) != null
        );

        if (!dom.has(type)) {
          // Do not test higher level JSX components, as we do not know what
          // low-level DOM element this maps to.
          return;
        }
        if (
          !hasInteractiveProps ||
          isContentEditable(type, attributes) ||
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
          (!isNonInteractiveElement(type, attributes) && !isNonInteractiveRole(type, attributes)) ||
          isAbstractRole(type, attributes)
        ) {
          // This rule has no opinion about abtract roles.
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
