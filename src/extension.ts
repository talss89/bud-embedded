import { Bud } from '@roots/bud-framework'
import fs from 'fs'

import { Extension } from '@roots/bud-framework/extension'
import type { WebpackPluginInstance } from '@roots/bud-framework/config'

import type { Compilation, Compiler } from 'webpack'
import type { CrossDefineManifest } from './types.js'

import zlib from 'node:zlib'
import {promisify} from 'node:util'
import {basename} from 'node:path'

import webpack from 'webpack'

import Assembler from './assembler.js'

import {
  bind,
  label,
  options,
  expose,
} from '@roots/bud-framework/extension/decorators'

import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

interface Options {
  body: string,
  crossDefs: [CrossDefineManifest] | [],
  compress: string | false,
  isEmbeddedBuild: boolean,
  emitAssembler: boolean
}

@label(`bud-embedded`)
@options<Options>({ isEmbeddedBuild: false, body: '', crossDefs: [], compress: false, emitAssembler: true })
@expose(`embedded`)
export default class BudEmbedded extends Extension<Options, WebpackPluginInstance> {

  @bind
  public override async register(bud: Bud) {
    bud.alias('@external', bud.path('@dist/external'))
    bud.alias('@external-build', bud.path('@dist/external/build'))
    bud.alias('@external-src', bud.path('@dist/external/src'))
  }

  @bind
  private async generateAllBinaryAssets(compilation, content) {

    var mainAsset = 'index.html'
    var compressedMainAsset: string | null = null;

    

    if(this.options.compress) {
            switch(this.options.compress) {
              case 'deflate':

                const Deflate = promisify(zlib.deflate);

                if(!compressedMainAsset) {
                  compressedMainAsset = mainAsset.replace(/\.html$/, '.html.d')
                }
                content = await Deflate(content);
                break;

              case 'brotli':

                const Brotli = promisify(zlib.brotliCompress);

                if(!compressedMainAsset) {
                  compressedMainAsset = mainAsset.replace(/\.html$/, '.html.br')
                }
                content = await Brotli(content);
                break;

              case 'gzip':
              default:

                const GZip = promisify(zlib.gzip);

                if(!compressedMainAsset) {
                  compressedMainAsset = mainAsset.replace(/\.html$/, '.html.gz')
                }
                content = await GZip(content);
                break;
            }

            compilation.emitAsset(`external/build/${compressedMainAsset}`, new webpack.sources.RawSource(content));
      }

      if (this.options.emitAssembler) {
        const asm = new Assembler(content);
        compilation.emitAsset(`external/build/${basename(compressedMainAsset ?? mainAsset)}.s`, new webpack.sources.RawSource(asm.compile(mainAsset)));
      }
  }

  @bind
  public override async apply(compiler: Compiler) {

    if(!this.options.isEmbeddedBuild) return;
    
    const {getHooks} = await this.app.module.import(
      `@roots/bud-support/html-webpack-plugin`,
      import.meta.url,
    ) 

    compiler.hooks.thisCompilation.tap('BudEmbedded', (compilation: Compilation) => {
      getHooks(compilation).beforeEmit.tapAsync(
        'BudEmbedded', 
        async (data, cb) => {
          await this.generateAllBinaryAssets(compilation, Buffer.from(data.html))          
          cb(null, data)
        }
      )
    });
  }

  @bind
  public override async configAfter(bud: Bud) {

    if(!bud.context.isEmbeddedChild) {
      await bud.embedded.start();
      return
    }

    bud.setPublicPath('/')

    const appHtml = this.options.body ? (`<%= require('/${(relative(bud.path('@src'), this.options.body).replace('./', ''))}').default %>`) : '<div id="root"></div>';
    const template_compiled_fn = bud.path(`@os-cache/bud-embedded-template-${(this.options.isEmbeddedBuild ? 'fw' : 'dev')}.ejs`);

    var template_t = fs.readFileSync(resolve(
      dirname(fileURLToPath(import.meta.url)),
      `..`,
      `vendor`,
      `template.t.ejs`,
    )).toString();

    const entrypoints = await bud.hooks.filter(`build.entry`, {});

    var dependencyRequires = "";

    for(const entry of Object.values(entrypoints)) {
      for(const file of entry.import) {
        dependencyRequires += `<% require('!!html-loader!/${file}').default %>`
      } 
    }
    
    template_t = template_t.replace('%%%HTML_APP_BODY%%%', appHtml);
    template_t = template_t.replace('%%%DEPENDENCY_REQUIRES%%%', dependencyRequires)

    fs.writeFileSync(template_compiled_fn, template_t);

    bud.html({
      template: template_compiled_fn,
      minify: this.options.isEmbeddedBuild,
      inject: !this.options.isEmbeddedBuild,
      isEmbeddedBuild: this.options.isEmbeddedBuild
    })

    bud.build.setLoader(`xd-loader`, await bud.module.resolve(`bud-embedded/cross-def-loader`))
    .setLoader(`dotenv-loader`, await bud.module.resolve(`bud-embedded/dotenv-loader`))
    .setItem(`xd`, {
      loader: 'xd-loader',
      options: {
        manifests: this.options.crossDefs
      }
    })
    .setItem(`dotenv`, {
      loader: 'dotenv-loader',
      options: {}
    })
    .setRule(`xd`, {
      test: /\.xd\.json$/,
      use: [`xd`],
    })
    .setRule(`dotenv`, {
      test: /kconfig$/,
      use: [`dotenv`],
      type: 'json'
    })

    bud.build.rules.json.setExclude((items) => [/\.xd\.json$/, ...(items ? items : [])]);

    if(!this.options.isEmbeddedBuild) return;

    bud.config({
      //@ts-ignore
      devServer: {
        hot: false
      },
      output: {
        path: bud.path('./dist-embedded'),
      }
    })
        
    bud.build.rules.svg.type = 'asset/inline';
    bud.build.rules.image.type = 'asset/inline';
    bud.build.rules.font.type = 'asset/inline';

  }

  @bind
  public crossDefine(manifests: CrossDefineManifest | [CrossDefineManifest]): BudEmbedded {
    if (!Array.isArray(manifests)) {
      this.setOption('crossDefs', [manifests]);
    } else {
      this.setOption('crossDefs', manifests);
    }

    return this;
  }

  @bind
  public isFirmware(enabled: boolean = true): BudEmbedded {
      this.setOption('isEmbeddedBuild', enabled);
    return this;
  }

  @bind
  public async start() {
    await this.app.make({
      label: this.app.context.label,
      isEmbeddedChild: true
    }, async (dev: Bud) => {

      dev.embedded.setOptions(this.options)

      const entrypoints = await this.app.hooks.filter(`build.entry`, {});
      dev.entry(entrypoints)
    })
    
    await this.app.make({
      label: '☰ ' + this.app.context.label + ' (embedded)',
      mode: 'production',
      hot: false,
      isEmbeddedChild: true
    }, async (firmware: Bud) => {

      firmware.runtime(false)
      firmware.devtool(false)
      firmware.minimize()

      firmware.embedded.setOptions(this.options)

      firmware.embedded.isFirmware()
  
      const entrypoints = await this.app.hooks.filter(`build.entry`, {});
      firmware.entry(entrypoints)
    })
  }

}