import type { LoaderContext } from 'webpack';
import type { CrossDefineManifest } from '../types.js';
interface Options {
    manifests: [CrossDefineManifest] | [];
}
export default function (this: LoaderContext<Options>, source: any): string;
export {};
