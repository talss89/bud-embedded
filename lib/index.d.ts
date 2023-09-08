/**
 * Recommended preset configuration for Bud.
 *
 * @see https://bud.js.org
 * @see https://github.com/roots/bud
 */
import BudEmbedded from './extension.js';
declare module '@roots/bud-framework' {
    interface Modules {
        '@talss89/bud-embedded': BudEmbedded;
    }
}
export { BudEmbedded as default };
