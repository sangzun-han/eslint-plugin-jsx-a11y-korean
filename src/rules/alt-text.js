/**
 * @fileoverview 대체 텍스트가 필요한 요소에 alt 텍스트가 있는지 검사하는 규칙
 * @author Ethan Cohen (원본)
 */

import { getProp, getPropValue, getLiteralPropValue } from "jsx-ast-utils";
import flatMap from "array.prototype.flatmap";

import { generateObjSchema, arraySchema } from "../util/schemas";
import getElementType from "../util/getElementType";
import hasAccessibleChild from "../util/hasAccessibleChild";
import isPresentationRole from "../util/isPresentationRole";

const DEFAULT_ELEMENTS = ["img", "object", "area", 'input[type="image"]'];

const schema = generateObjSchema({
  elements: arraySchema,
  img: arraySchema,
  object: arraySchema,
  area: arraySchema,
  'input[type="image"]': arraySchema,
});

const ariaLabelHasValue = (prop) => {
  const value = getPropValue(prop);
  if (value === undefined) return false;
  if (typeof value === "string" && value.length === 0) return false;
  return true;
};

const ruleByElement = {
  img(context, node, nodeType) {
    const altProp = getProp(node.attributes, "alt");

    if (altProp === undefined) {
      if (isPresentationRole(nodeType, node.attributes)) {
        context.report({
          node,
          messageId: "imgPreferAltOverRole",
        });
        return;
      }

      const ariaLabelProp = getProp(node.attributes, "aria-label");
      if (ariaLabelProp !== undefined && !ariaLabelHasValue(ariaLabelProp)) {
        context.report({
          node,
          messageId: "ariaLabelEmpty",
        });
        return;
      }

      const ariaLabelledbyProp = getProp(node.attributes, "aria-labelledby");
      if (ariaLabelledbyProp !== undefined && !ariaLabelHasValue(ariaLabelledbyProp)) {
        context.report({
          node,
          messageId: "ariaLabelledbyEmpty",
        });
        return;
      }

      context.report({
        node,
        messageId: "imgMissingAlt",
      });
      return;
    }

    const altValue = getPropValue(altProp);
    const isNullValued = altProp.value === null;

    if ((altValue && !isNullValued) || altValue === "") return;

    context.report({
      node,
      messageId: "imgInvalidAlt",
    });
  },

  object(context, node, _nodeType, elementType) {
    const ariaLabelProp = getProp(node.attributes, "aria-label");
    const ariaLabelledbyProp = getProp(node.attributes, "aria-labelledby");
    const hasLabel = ariaLabelHasValue(ariaLabelProp) || ariaLabelHasValue(ariaLabelledbyProp);
    const titleProp = getLiteralPropValue(getProp(node.attributes, "title"));
    const hasTitleAttr = !!titleProp;

    if (hasLabel || hasTitleAttr || hasAccessibleChild(node.parent, elementType)) return;

    context.report({
      node,
      messageId: "objectMissingText",
    });
  },

  area(context, node) {
    const ariaLabelProp = getProp(node.attributes, "aria-label");
    const ariaLabelledbyProp = getProp(node.attributes, "aria-labelledby");
    const hasLabel = ariaLabelHasValue(ariaLabelProp) || ariaLabelHasValue(ariaLabelledbyProp);

    if (hasLabel) return;

    const altProp = getProp(node.attributes, "alt");
    const altValue = altProp ? getPropValue(altProp) : undefined;
    const isNullValued = altProp?.value === null;

    if (altProp === undefined || (!isNullValued && !altValue && altValue !== "")) {
      context.report({
        node,
        messageId: "areaMissingText",
      });
    }
  },

  'input[type="image"]'(context, node, nodeType) {
    if (nodeType === "input") {
      const typePropValue = getPropValue(getProp(node.attributes, "type"));
      if (typePropValue !== "image") return;
    }

    const ariaLabelProp = getProp(node.attributes, "aria-label");
    const ariaLabelledbyProp = getProp(node.attributes, "aria-labelledby");
    const hasLabel = ariaLabelHasValue(ariaLabelProp) || ariaLabelHasValue(ariaLabelledbyProp);

    if (hasLabel) return;

    const altProp = getProp(node.attributes, "alt");
    const altValue = altProp ? getPropValue(altProp) : undefined;
    const isNullValued = altProp?.value === null;

    if (altProp === undefined || (!isNullValued && !altValue && altValue !== "")) {
      context.report({
        node,
        messageId: "inputImageMissingText",
      });
    }
  },
};

export default {
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/blob/HEAD/docs/rules/alt-text.md",
      description: "대체 텍스트가 필요한 모든 요소는 의미 있는 정보를 포함해야 합니다.",
    },
    schema: [schema],
    messages: {
      imgMissingAlt: 'img 요소에는 alt 속성이 필요합니다. 의미 있는 텍스트 또는 alt=""를 사용하세요.',
      imgPreferAltOverRole: 'role="presentation" 보다는 alt="" 속성을 사용하는 것이 권장됩니다.',
      imgInvalidAlt: 'img 요소의 alt 속성이 유효하지 않습니다. 장식용이면 alt=""로 설정하세요.',
      ariaLabelEmpty: "aria-label 속성에는 값이 필요합니다. 가능하면 alt 속성을 사용하세요.",
      ariaLabelledbyEmpty: "aria-labelledby 속성에는 값이 필요합니다. 가능하면 alt 속성을 사용하세요.",
      objectMissingText: "<object> 요소에는 내부 텍스트, aria-label 또는 aria-labelledby 중 하나가 필요합니다.",
      areaMissingText: "<area> 요소는 alt, aria-label 또는 aria-labelledby 속성을 통해 대체 텍스트를 제공해야 합니다.",
      inputImageMissingText:
        'type="image"인 <input> 요소는 alt, aria-label 또는 aria-labelledby 중 하나를 사용해야 합니다.',
    },
  },

  create(context) {
    const options = context.options[0] || {};
    const elementOptions = options.elements || DEFAULT_ELEMENTS;

    const customComponents = flatMap(elementOptions, (element) => options[element]);

    const typesToValidate = new Set(
      [].concat(customComponents, elementOptions).map((type) => (type === 'input[type="image"]' ? "input" : type))
    );

    const elementType = getElementType(context);

    return {
      JSXOpeningElement(node) {
        const nodeType = elementType(node);
        if (!typesToValidate.has(nodeType)) return;

        let DOMElement = nodeType === "input" ? 'input[type="image"]' : nodeType;

        if (!elementOptions.includes(DOMElement)) {
          DOMElement = elementOptions.find((element) => (options[element] || []).includes(nodeType));
        }

        ruleByElement[DOMElement]?.(context, node, nodeType, elementType);
      },
    };
  },
};
