import { Bud } from '@roots/bud-framework';
import { Extension } from '@roots/bud-framework/extension';
interface Options {
    body: string | false;
}
export default class BudEmbedded extends Extension<Options> {
    getBody: () => string;
    setBody: (body: string) => this;
    register(bud: Bud): Promise<void>;
}
export {};
