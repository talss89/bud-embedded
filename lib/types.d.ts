import type BudEmbedded from './extension.js';
import type { Item, Loader, Rule } from '@roots/bud-build';
declare module '@roots/bud-framework' {
    interface Modules {
        'bud-embedded': BudEmbedded;
    }
    interface Loaders {
        'xd-loader': Loader;
        'dotenv-loader': Loader;
    }
    interface Items {
        xd: Item;
        dotenv: Item;
    }
    interface Rules {
        xd: Rule;
        dotenv: Rule;
    }
    interface Bud {
        embedded: BudEmbedded;
    }
    interface Context {
        isEmbeddedChild: boolean;
    }
}
export interface CrossDefineManifest {
    manifest: string;
    langs: [string];
}
