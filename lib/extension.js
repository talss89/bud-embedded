import { __decorate } from "tslib";
import { Bud } from '@roots/bud-framework';
import fs from 'fs';
import { Extension } from '@roots/bud-framework/extension';
import { bind, label, options, } from '@roots/bud-framework/extension/decorators';
import { expose } from '@roots/bud-framework/extension/decorators/expose';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
let BudEmbedded = class BudEmbedded extends Extension {
    async register(bud) {
    }
    async configAfter(bud) {
        bud.build.rules.svg.type = 'asset/inline';
        bud.build.rules.image.type = 'asset/inline';
        bud.build.rules.font.type = 'asset/inline';
        //bud.build.rules.webp.type = 'asset/inline';
        bud.setPublicPath('/');
        const appHtml = (this.options.bodyPath ? (relative(bud.path('@src'), bud.path(this.options.bodyPath)).replace('./', '')) : 'app.html');
        const template_compiled_fn = bud.path('@os-cache/bud-embedded-template.ejs');
        var template_t = fs.readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), `..`, `vendor`, `template.t.ejs`)).toString();
        template_t = template_t.replace('%%%APPENTRY%%%', appHtml);
        fs.writeFileSync(template_compiled_fn, template_t);
        //@ts-ignore
        bud.html({
            template: template_compiled_fn,
            meta: {
                viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
            },
            minify: !bud.isProduction,
            inject: !bud.isProduction,
            isProduction: bud.isProduction
        });
        bud.after(async () => {
            await bud.when(bud.isProduction, () => bud.sh(`gzip -k -f dist/index.html`));
        });
    }
    setBody(body) {
        this.setOption(`bodyPath`, body);
        return this;
    }
};
__decorate([
    bind
], BudEmbedded.prototype, "register", null);
__decorate([
    bind
], BudEmbedded.prototype, "configAfter", null);
__decorate([
    bind
], BudEmbedded.prototype, "setBody", null);
BudEmbedded = __decorate([
    label(`bud-embedded`),
    options({ bodyPath: '' }),
    expose(`embedded`)
], BudEmbedded);
export default BudEmbedded;
