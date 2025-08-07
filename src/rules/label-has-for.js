/**
 * @fileoverview Enforce label tags have htmlFor attribute.
 * @author Ethan Cohen
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { hasProp, getProp, getPropValue } from "jsx-ast-utils";
import { generateObjSchema, arraySchema, enumArraySchema } from "../util/schemas";
import getElementType from "../util/getElementType";
import hasAccessibleChild from "../util/hasAccessibleChild";

const enumValues = ["nesting", "id"];
const schema = {
  type: "object",
  properties: {
    components: arraySchema,
    required: {
      oneOf: [
        { type: "string", enum: enumValues },
        generateObjSchema({ some: enumArraySchema(enumValues) }, ["some"]),
        generateObjSchema({ every: enumArraySchema(enumValues) }, ["every"]),
      ],
    },
    allowChildren: { type: "boolean" },
  },
};
// Breadth-first search, assuming that HTML for forms is shallow.
function validateNesting(node) {
  let queue = node.parent.children.slice();
  let child;
  let opener;
  while (queue.length) {
    child = queue.shift();
    opener = child.openingElement;
    if (
      child.type === "JSXElement" &&
      opener &&
      (opener.name.name === "input" || opener.name.name === "textarea" || opener.name.name === "select")
    ) {
      return true;
    }
    if (child.children) {
      queue = queue.concat(child.children);
    }
  }
  return false;
}

function validateID({ attributes }, context) {
  const { settings } = context;
  const htmlForAttributes = settings["jsx-a11y"]?.attributes?.for ?? ["htmlFor"];

  for (let i = 0; i < htmlForAttributes.length; i += 1) {
    const attribute = htmlForAttributes[i];
    if (hasProp(attributes, attribute)) {
      const htmlForAttr = getProp(attributes, attribute);
      const htmlForValue = getPropValue(htmlForAttr);

      return htmlForAttr !== false && !!htmlForValue;
    }
  }

  return false;
}

function validate(node, required, allowChildren, elementType, context) {
  if (allowChildren === true) {
    return hasAccessibleChild(node.parent, elementType);
  }
  if (required === "nesting") {
    return validateNesting(node);
  }
  return validateID(node, context);
}

function getValidityStatus(node, required, allowChildren, elementType, context) {
  if (Array.isArray(required.some)) {
    const isValid = required.some.some((rule) => validate(node, rule, allowChildren, elementType, context));
    const message = !isValid
      ? `<label> 태그는 다음 중 **하나 이상**의 방식으로 폼 컨트롤과 연결되어야 합니다: ${required.some.join(", ")}`
      : null;
    return { isValid, message };
  }

  if (Array.isArray(required.every)) {
    const isValid = required.every.every((rule) => validate(node, rule, allowChildren, elementType, context));
    const message = !isValid
      ? `<label> 태그는 다음 **모든 방식**으로 폼 컨트롤과 연결되어야 합니다: ${required.every.join(", ")}`
      : null;
    return { isValid, message };
  }

  const isValid = validate(node, required, allowChildren, elementType, context);
  const message = !isValid ? `<label> 태그는 "${required}" 방식으로 폼 컨트롤과 연결되어야 합니다.` : null;

  return { isValid, message };
}

export default {
  meta: {
    deprecated: true,
    replacedBy: ["label-has-associated-control"],
    docs: {
      description: "`<label>` 태그에 `htmlFor` 속성이 포함되어 있어야 합니다.",
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/label-has-for.md",
    },
    schema: [schema],
  },

  create: (context) => {
    const elementType = getElementType(context);
    return {
      JSXOpeningElement(node) {
        const options = context.options[0] || {};
        const componentOptions = options.components || [];
        const typesToValidate = ["label"].concat(componentOptions);
        const nodeType = elementType(node);

        // Only check 'label' elements and custom types.
        if (typesToValidate.indexOf(nodeType) === -1) {
          return;
        }

        const required = options.required || { every: ["nesting", "id"] };
        const allowChildren = options.allowChildren || false;

        const { isValid, message } = getValidityStatus(node, required, allowChildren, elementType, context);
        if (!isValid) {
          context.report({
            node,
            message,
          });
        }
      },
    };
  },
};
