import { __decorate } from "tslib";
import { Bud } from '@roots/bud-framework';
import fs from 'fs';
import { Extension } from '@roots/bud-framework/extension';
import zlib from 'node:zlib';
import { promisify } from 'node:util';
import { basename } from 'node:path';
import webpack from 'webpack';
import Assembler from './assembler.js';
import { bind, label, options, expose, } from '@roots/bud-framework/extension/decorators';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
let BudEmbedded = class BudEmbedded extends Extension {
    async register(bud) {
        bud.alias('@external', bud.path('@dist/external'));
        bud.alias('@external-build', bud.path('@dist/external/build'));
        bud.alias('@external-src', bud.path('@dist/external/src'));
    }
    async generateAllBinaryAssets(compilation, content) {
        var mainAsset = 'index.html';
        var compressedMainAsset = null;
        if (this.options.compress) {
            switch (this.options.compress) {
                case 'deflate':
                    const Deflate = promisify(zlib.deflate);
                    if (!compressedMainAsset) {
                        compressedMainAsset = mainAsset.replace(/\.html$/, '.d.html');
                    }
                    content = await Deflate(content);
                    break;
                case 'brotli':
                    const Brotli = promisify(zlib.brotliCompress);
                    if (!compressedMainAsset) {
                        compressedMainAsset = mainAsset.replace(/\.html$/, '.br.html');
                    }
                    content = await Brotli(content);
                    break;
                case 'gzip':
                default:
                    const GZip = promisify(zlib.gzip);
                    if (!compressedMainAsset) {
                        compressedMainAsset = mainAsset.replace(/\.html$/, '.gz.html');
                    }
                    content = await GZip(content);
                    break;
            }
            compilation.emitAsset(`external/build/${compressedMainAsset}`, new webpack.sources.RawSource(content));
        }
        if (this.options.emitAssembly) {
            const asm = new Assembler(content);
            compilation.emitAsset(`external/build/${basename(compressedMainAsset ?? mainAsset)}.S`, new webpack.sources.RawSource(asm.compile(mainAsset)));
        }
    }
    async apply(compiler) {
        if (!this.options.isEmbeddedBuild)
            return;
        const { getHooks } = await this.app.module.import(`@roots/bud-support/html-webpack-plugin`, import.meta.url);
        compiler.hooks.thisCompilation.tap('BudEmbedded', (compilation) => {
            getHooks(compilation).beforeEmit.tapAsync('BudEmbedded', async (data, cb) => {
                await this.generateAllBinaryAssets(compilation, Buffer.from(data.html));
                cb(null, data);
            });
        });
    }
    async configAfter(bud) {
        if (!bud.context.isEmbeddedChild) {
            await bud.embedded.start();
        }
        bud.setPublicPath('/');
        const appHtml = (this.options.body ? (relative(bud.path('@src'), this.options.body).replace('./', '')) : 'app.html');
        const template_compiled_fn = bud.path(`@os-cache/bud-embedded-template-${(this.options.isEmbeddedBuild ? 'fw' : 'dev')}.ejs`);
        var template_t = fs.readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), `..`, `vendor`, `template.t.ejs`)).toString();
        const entrypoints = await bud.hooks.filter(`build.entry`, {});
        var dependencyRequires = "";
        for (const entry of Object.values(entrypoints)) {
            for (const file of entry.import) {
                dependencyRequires += `<% require('!!html-loader!/${file}').default %>`;
            }
        }
        template_t = template_t.replace('%%%APPENTRY%%%', appHtml);
        template_t = template_t.replace('%%%DEPENDENCY_REQUIRES%%%', dependencyRequires);
        fs.writeFileSync(template_compiled_fn, template_t);
        bud.html({
            template: template_compiled_fn,
            minify: this.options.isEmbeddedBuild,
            inject: !this.options.isEmbeddedBuild,
            isEmbeddedBuild: this.options.isEmbeddedBuild
        });
        bud.build.setLoader(`xd-loader`, await bud.module.resolve(`bud-embedded/cross-def-loader`))
            .setItem(`xd`, {
            loader: 'xd-loader',
            options: {
                manifests: this.options.crossDefs
            }
        })
            .setRule(`xd`, {
            test: /\.xd\.json$/,
            use: [`xd`],
        });
        bud.build.rules.json.setExclude((items) => [/\.xd\.json$/, ...(items ? items : [])]);
        if (!this.options.isEmbeddedBuild)
            return;
        bud.config({
            //@ts-ignore
            devServer: {
                hot: false
            },
            output: {
                path: bud.path('./embedded-dist'),
            }
        });
        bud.build.rules.svg.type = 'asset/inline';
        bud.build.rules.image.type = 'asset/inline';
        bud.build.rules.font.type = 'asset/inline';
    }
    crossDefine(manifests) {
        if (!Array.isArray(manifests)) {
            this.setOption('crossDefs', [manifests]);
        }
        else {
            this.setOption('crossDefs', manifests);
        }
        return this;
    }
    isFirmware(enabled = true) {
        this.setOption('isEmbeddedBuild', enabled);
        return this;
    }
    async start() {
        await this.app.make({
            label: this.app.context.label,
            isEmbeddedChild: true
        }, async (dev) => {
            const entrypoints = await this.app.hooks.filter(`build.entry`, {});
            dev.entry(entrypoints);
        });
        await this.app.make({
            label: '☰ ' + this.app.context.label + ' (embedded)',
            mode: 'production',
            hot: false,
            isEmbeddedChild: true
        }, async (firmware) => {
            firmware.runtime(false);
            firmware.devtool(false);
            firmware.minimize();
            firmware.embedded.setOptions(this.options);
            firmware.embedded.isFirmware();
            const entrypoints = await this.app.hooks.filter(`build.entry`, {});
            firmware.entry(entrypoints);
        });
    }
};
__decorate([
    bind
], BudEmbedded.prototype, "register", null);
__decorate([
    bind
], BudEmbedded.prototype, "generateAllBinaryAssets", null);
__decorate([
    bind
], BudEmbedded.prototype, "apply", null);
__decorate([
    bind
], BudEmbedded.prototype, "configAfter", null);
__decorate([
    bind
], BudEmbedded.prototype, "crossDefine", null);
__decorate([
    bind
], BudEmbedded.prototype, "isFirmware", null);
__decorate([
    bind
], BudEmbedded.prototype, "start", null);
BudEmbedded = __decorate([
    label(`bud-embedded`),
    options({ isEmbeddedBuild: false, body: '', crossDefs: [], compress: false, emitAssembly: true }),
    expose(`embedded`)
], BudEmbedded);
export default BudEmbedded;
