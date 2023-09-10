
import CrossDefCompiler from 'cross-def'
import type {LoaderContext} from 'webpack'
import type { CrossDefineManifest } from '../types.js'
import {basename} from 'path'

interface Options {
    manifests: [CrossDefineManifest] | []
}

export default function(this: LoaderContext<Options>, source) {
    const options = this.getOptions();
    var output = "{}";

    const crossDefCompiler = new CrossDefCompiler(JSON.parse(source));
    crossDefCompiler.parse();

    if(options.manifests.length > 0) {
        for(const crossDefineManifest of options.manifests) {
        
            if(crossDefineManifest.manifest !== this.resourcePath) continue;

            for(const lang of crossDefineManifest.langs) {
                if(lang === 'json') {
                    continue;
                }
                const outputFn = basename(crossDefineManifest.manifest).replace(/\.xd\.json$/, '') + "." + crossDefCompiler.getOutputFileExtension(lang);
                this.emitFile('external/src/' + outputFn, crossDefCompiler.compile(lang, outputFn));
            }
        }
    }
    
    output = crossDefCompiler.compile('json', this.resourcePath);
    
    return output;
}