import spaceTrim from 'spacetrim';
import { string_markdown } from '../../types/typeAliases';
/**
 * Removes voids from markdown content
 * It is useful for postprocessing markdown content, for example the execution reports
 *
 * @param {string_markdown} content - The string to remove voids from.
 * @returns {string_markdown} The input string with all voids removed.
 *
 *  @private within the library
 */
export function removeVoids(content: string_markdown): string_markdown {
    return spaceTrim(content.replace(/<!--(.*?)-->/gs, '')) as TContent;
}
