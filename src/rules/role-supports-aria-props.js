/**
 * @fileoverview Enforce that elements with explicit or implicit roles defined contain only
 * `aria-*` properties supported by that `role`.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { aria, roles } from "aria-query";
import { getProp, getLiteralPropValue, getPropValue, propName } from "jsx-ast-utils";

import { generateObjSchema } from "../util/schemas";
import getElementType from "../util/getElementType";
import getImplicitRole from "../util/getImplicitRole";

const errorMessage = (attr, role, tag, isImplicit) => {
  if (isImplicit) {
    return `속성 "${attr}"은(는) 역할 "${role}"에서 지원되지 않습니다. 이 역할은 <${tag}> 요소에 암시적으로 부여되어 있습니다.`;
  }
  return `속성 "${attr}"은(는) 역할 "${role}"에서 지원되지 않습니다.`;
};
const schema = generateObjSchema();

export default {
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/role-supports-aria-props.md",
      description:
        "역할(role)이 명시되었거나 암시적으로 적용된 경우, 해당 역할이 허용하는 aria-* 속성만 사용할 수 있도록 강제합니다.",
    },
    schema: [schema],
  },

  create(context) {
    const elementType = getElementType(context);
    return {
      JSXOpeningElement(node) {
        // If role is not explicitly defined, then try and get its implicit role.
        const type = elementType(node);
        const role = getProp(node.attributes, "role");
        const roleValue = role ? getLiteralPropValue(role) : getImplicitRole(type, node.attributes);
        const isImplicit = roleValue && role === undefined;

        // If there is no explicit or implicit role, then assume that the element
        // can handle the global set of aria-* properties.
        // This actually isn't true - should fix in future release.
        if (typeof roleValue !== "string" || roles.get(roleValue) === undefined) {
          return;
        }

        // Make sure it has no aria-* properties defined outside its property set.
        const { props: propKeyValues } = roles.get(roleValue);
        const invalidAriaPropsForRole = new Set(aria.keys().filter((attribute) => !(attribute in propKeyValues)));

        node.attributes
          .filter(
            (prop) =>
              getPropValue(prop) != null && // Ignore the attribute if its value is null or undefined.
              prop.type !== "JSXSpreadAttribute" // Ignore the attribute if it's a spread.
          )
          .forEach((prop) => {
            const name = propName(prop);
            if (invalidAriaPropsForRole.has(name)) {
              context.report({
                node,
                message: errorMessage(name, roleValue, type, isImplicit),
              });
            }
          });
      },
    };
  },
};
