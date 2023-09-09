/// <reference types="webpack" />
import { Bud } from '@roots/bud-framework';
import { Extension } from '@roots/bud-framework/extension';
import type { WebpackPluginInstance } from '@roots/bud-framework/config';
interface Options {
    bodyPath: string;
}
export default class BudEmbedded extends Extension<Options, WebpackPluginInstance> {
    register(bud: Bud): Promise<void>;
    configAfter(bud: Bud): Promise<void>;
    setBody(body: Options[`bodyPath`]): this;
}
export {};
