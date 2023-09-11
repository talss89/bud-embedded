import { Bud } from '@roots/bud-framework';
import { Extension } from '@roots/bud-framework/extension';
import type { WebpackPluginInstance } from '@roots/bud-framework/config';
import type { Compiler } from 'webpack';
import type { CrossDefineManifest } from './types.js';
interface Options {
    body: string;
    crossDefs: [CrossDefineManifest] | [];
    compress: string | false;
    isEmbeddedBuild: boolean;
    emitAssembler: boolean;
}
export default class BudEmbedded extends Extension<Options, WebpackPluginInstance> {
    register(bud: Bud): Promise<void>;
    private generateAllBinaryAssets;
    apply(compiler: Compiler): Promise<void>;
    configAfter(bud: Bud): Promise<void>;
    crossDefine(manifests: CrossDefineManifest | [CrossDefineManifest]): BudEmbedded;
    isFirmware(enabled?: boolean): BudEmbedded;
    start(): Promise<void>;
}
export {};
