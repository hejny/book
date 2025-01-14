import spaceTrim from 'spacetrim';
import type { PromptTemplateJson } from '../types/PromptTemplatePipelineJson/PromptTemplateJson';
import type { PromptTemplatePipelineJson } from '../types/PromptTemplatePipelineJson/PromptTemplatePipelineJson';
import type { string_name } from '../types/typeAliases';

/**
 * Validates PromptTemplatePipelineJson if it is logically valid.
 *
 * It checks:
 * -   if it has correct parameters dependency
 *
 * It does NOT check:
 * -   if it is valid json
 * -   if it is meaningful
 *
 * @param ptp valid or invalid PromptTemplatePipelineJson
 * @throws {Error} if invalid
 */
export function validatePromptTemplatePipelineJson(ptp: PromptTemplatePipelineJson): void {
    const definedParameters: Set<string> = new Set(
        ptp.parameters.filter(({ isInput }) => isInput).map(({ name }) => name),
    );

    // Note: Check each template individually
    for (const template of ptp.promptTemplates) {
        if (definedParameters.has(template.resultingParameterName)) {
            throw new Error(`Parameter {${template.resultingParameterName}} is defined multiple times`);
        }

        if (template.jokers && template.jokers.length > 0) {
            if (
                !template.expectFormat &&
                !template.expectAmount /* <- TODO: Require at least 1 -> min <- expectation to use jokers */
            ) {
                throw new Error(`Joker parameters are used but no expectations are defined`);
            }

            for (const joker of template.jokers) {
                if (!template.dependentParameterNames.includes(joker)) {
                    throw new Error(`Parameter {${joker}} is used as joker but not in dependentParameterNames`);
                }
            }
        }

        if (template.expectAmount) {
            for (const [unit, { min, max }] of Object.entries(template.expectAmount)) {
                if (min !== undefined && max !== undefined && min > max) {
                    throw new Error(`Min expectation (=${min}) of ${unit} is higher than max expectation (=${max})`);
                }

                if (min !== undefined && min < 0) {
                    throw new Error(`Min expectation of ${unit} must be zero or positive`);
                }

                if (max !== undefined && max <= 0) {
                    throw new Error(`Max expectation of ${unit} must be positive`);
                }
            }
        }

        definedParameters.add(template.resultingParameterName);
    }

    // Note: Detect circular dependencies
    let resovedParameters: Array<string_name> = ptp.parameters.filter(({ isInput }) => isInput).map(({ name }) => name);
    let unresovedTemplates: Array<PromptTemplateJson> = [...ptp.promptTemplates];
    while (unresovedTemplates.length > 0) {
        const currentlyResovedTemplates = unresovedTemplates.filter((template) =>
            template.dependentParameterNames.every((name) => resovedParameters.includes(name)),
        );

        if (currentlyResovedTemplates.length === 0) {
            throw new Error(
                spaceTrim(
                    (block) => `

                        Can not resolve some parameters
                        It may be circular dependencies

                        Can not resolve:
                        ${block(
                            unresovedTemplates
                                .map(
                                    ({ resultingParameterName, dependentParameterNames }) =>
                                        `- {${resultingParameterName}} depends on ${dependentParameterNames
                                            .map((dependentParameterName) => `{${dependentParameterName}}`)
                                            .join(', ')}`,
                                )
                                .join('\n'),
                        )}

                        Resolved:
                        ${block(resovedParameters.map((name) => `- {${name}}`).join('\n'))}
                    `,
                ),
            );
        }

        resovedParameters = [
            ...resovedParameters,
            ...currentlyResovedTemplates.map(({ resultingParameterName }) => resultingParameterName),
        ];

        unresovedTemplates = unresovedTemplates.filter((template) => !currentlyResovedTemplates.includes(template));
    }
}

/**
 * TODO: [🧠] Work with ptbkVersion
 * TODO: Use here some json-schema, Zod or something similar and change it to:
 *     > /**
 *     >  * Validates PromptTemplatePipelineJson if it is logically valid.
 *     >  *
 *     >  * It checks:
 *     >  * -   it has a valid structure
 *     >  * -   ...
 *     >  ex port function validatePromptTemplatePipelineJson(ptp: unknown): asserts ptp is PromptTemplatePipelineJson {
 */
