/**
 * @fileoverview Enforce explicit role property is not the
 * same as implicit/default role property on element.
 * @author Ethan Cohen <@evcohen>
 * @flow
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import includes from "array-includes";
import hasOwn from "hasown";
import type { JSXOpeningElement } from "ast-types-flow";
import type { ESLintConfig, ESLintContext, ESLintVisitorSelectorConfig } from "../../flow/eslint";
import getElementType from "../util/getElementType";
import getExplicitRole from "../util/getExplicitRole";
import getImplicitRole from "../util/getImplicitRole";

const errorMessage = (element, implicitRole) =>
  `요소 <${element}>에는 기본적으로 '${implicitRole}' 역할이 암묵적으로 지정되어 있습니다. 이를 명시적으로 지정하는 것은 중복이며 피해야 합니다.`;

const DEFAULT_ROLE_EXCEPTIONS = { nav: ["navigation"] };

export default ({
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/no-redundant-roles.md",
      description: "기본적으로 지정된 implicit role과 동일한 role을 명시적으로 작성하지 않도록 강제합니다.",
    },
    schema: [
      {
        type: "object",
        additionalProperties: {
          type: "array",
          items: {
            type: "string",
          },
          uniqueItems: true,
        },
      },
    ],
  },

  create: (context: ESLintContext): ESLintVisitorSelectorConfig => {
    const { options } = context;
    const elementType = getElementType(context);
    return {
      JSXOpeningElement: (node: JSXOpeningElement) => {
        const type = elementType(node);
        const implicitRole = getImplicitRole(type, node.attributes);
        const explicitRole = getExplicitRole(type, node.attributes);

        if (!implicitRole || !explicitRole) {
          return;
        }

        if (implicitRole === explicitRole) {
          const allowedRedundantRoles = options[0] || {};
          let redundantRolesForElement;

          if (hasOwn(allowedRedundantRoles, type)) {
            redundantRolesForElement = allowedRedundantRoles[type];
          } else {
            redundantRolesForElement = DEFAULT_ROLE_EXCEPTIONS[type] || [];
          }

          if (includes(redundantRolesForElement, implicitRole)) {
            return;
          }

          context.report({
            node,
            message: errorMessage(type, implicitRole.toLowerCase()),
          });
        }
      },
    };
  },
}: ESLintConfig);
