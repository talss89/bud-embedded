import { Bud } from '@roots/bud-framework';
import { Extension } from '@roots/bud-framework/extension';
/**
 * Recommended preset
 */
export default class BudEmbedded extends Extension {
    /**
     * This should be unnecessary in bud 7.0.0 as the user
     * will be required to explicitly install a compiler.
     *
     * {@link Extension.register}
     */
    register(bud: Bud): Promise<void>;
}
