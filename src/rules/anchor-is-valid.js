/**
 * @fileoverview Performs validity check on anchor hrefs. Warns when anchors are used as buttons.
 * @author Almero Steyn
 * @flow
 */

// ----------------------------------------------------------------------------
// Rule Definition
// ----------------------------------------------------------------------------

import { getProp, getPropValue } from "jsx-ast-utils";
import type { JSXOpeningElement } from "ast-types-flow";
import safeRegexTest from "safe-regex-test";
import type { ESLintConfig, ESLintContext, ESLintVisitorSelectorConfig } from "../../flow/eslint";
import { generateObjSchema, arraySchema, enumArraySchema } from "../util/schemas";
import getElementType from "../util/getElementType";

const allAspects = ["noHref", "invalidHref", "preferButton"];

const preferButtonErrorMessage =
  "버튼처럼 사용된 앵커입니다. 앵커는 주로 페이지 이동 용도로 사용해야 하며, 동작 트리거용이면 <button> 태그를 사용하세요.";

const noHrefErrorMessage =
  "키보드 접근성을 보장하려면 <a> 태그에 href 속성이 필수입니다. href를 제공할 수 없다면, 버튼을 사용하고 스타일로 링크처럼 보이게 하세요.";

const invalidHrefErrorMessage =
  'href에는 유효한 경로가 있어야 합니다. 빈 문자열, "#" 또는 "javascript:"는 접근성을 해칩니다. 유효한 링크가 없다면 버튼을 사용하세요.';

const schema = generateObjSchema({
  components: arraySchema,
  specialLink: arraySchema,
  aspects: enumArraySchema(allAspects, 1),
});

export default ({
  meta: {
    docs: {
      url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y/tree/HEAD/docs/rules/anchor-is-valid.md",
      description: "모든 앵커가 유효하고 네비게이션 가능한 요소인지 검사합니다.",
    },
    schema: [schema],
  },

  create: (context: ESLintContext): ESLintVisitorSelectorConfig => {
    const elementType = getElementType(context);
    const testJShref = safeRegexTest(/^\W*?javascript:/);

    return {
      JSXOpeningElement: (node: JSXOpeningElement): void => {
        const { attributes } = node;
        const options = context.options[0] || {};
        const componentOptions = options.components || [];
        const typeCheck = ["a"].concat(componentOptions);
        const nodeType = elementType(node);

        // Only check anchor elements and custom types.
        if (typeCheck.indexOf(nodeType) === -1) {
          return;
        }

        // Set up the rule aspects to check.
        const aspects = options.aspects || allAspects;

        // Create active aspect flag object. Failing checks will only report
        // if the related flag is set to true.
        const activeAspects = {};
        allAspects.forEach((aspect) => {
          activeAspects[aspect] = aspects.indexOf(aspect) !== -1;
        });

        const propOptions = options.specialLink || [];
        const propsToValidate = ["href"].concat(propOptions);
        const values = propsToValidate.map((prop) => getPropValue(getProp(node.attributes, prop)));
        // Checks if any actual or custom href prop is provided.
        const hasAnyHref = values.some((value) => value != null);
        // Need to check for spread operator as props can be spread onto the element
        // leading to an incorrect validation error.
        const hasSpreadOperator = attributes.some((prop) => prop.type === "JSXSpreadAttribute");
        const onClick = getProp(attributes, "onClick");

        // When there is no href at all, specific scenarios apply:
        if (!hasAnyHref) {
          // If no spread operator is found and no onClick event is present
          // it is a link without href.
          if (!hasSpreadOperator && activeAspects.noHref && (!onClick || (onClick && !activeAspects.preferButton))) {
            context.report({
              node,
              message: noHrefErrorMessage,
            });
          }
          // If no spread operator is found but an onClick is preset it should be a button.
          if (!hasSpreadOperator && onClick && activeAspects.preferButton) {
            context.report({
              node,
              message: preferButtonErrorMessage,
            });
          }
          return;
        }

        // Hrefs have been found, now check for validity.
        const invalidHrefValues = values.filter(
          (value) => value != null && typeof value === "string" && (!value.length || value === "#" || testJShref(value))
        );
        if (invalidHrefValues.length !== 0) {
          // If an onClick is found it should be a button, otherwise it is an invalid link.
          if (onClick && activeAspects.preferButton) {
            context.report({
              node,
              message: preferButtonErrorMessage,
            });
          } else if (activeAspects.invalidHref) {
            context.report({
              node,
              message: invalidHrefErrorMessage,
            });
          }
        }
      },
    };
  },
}: ESLintConfig);
