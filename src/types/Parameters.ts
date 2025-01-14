/**
 * Parameters of the prompt template (pipeline)
 *
 * There are three types of parameters:
 * - **INPUT  PARAMETERs** are required to execute the prompt template pipeline.
 * - **Intermediate parameters** are used internally in the prompt template pipeline.
 * - **OUTPUT PARAMETERs** are not used internally in the prompt template pipeline, but are returned as the result of the prompt template pipeline execution.
 *
 * @see https://github.com/webgptorg/promptbook#parameters
 */
export type Parameters = object;

/**
 * TODO: Constrain type to Simple key-value object, only string keys and string values and no index signature + only camelCase keys and spaceTrimmed values
 */
