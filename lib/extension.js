import { __decorate } from "tslib";
import { Bud } from '@roots/bud-framework';
import { Extension } from '@roots/bud-framework/extension';
import { bind, label, options, } from '@roots/bud-framework/extension/decorators';
import { expose } from '@roots/bud-framework/extension/decorators/expose';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
let BudEmbedded = class BudEmbedded extends Extension {
    async register(bud) {
        console.error(this.options);
        // @ts-ignore
        bud.html({
            appHtml: this.options.body ? bud.path(this.options.body) : null,
            template: resolve(dirname(fileURLToPath(import.meta.url)), `..`, `vendor`, `template.ejs`),
            minify: !bud.isProduction,
            inject: !bud.isProduction,
            isProduction: bud.isProduction
        });
        bud.after(async () => {
            await bud.when(bud.isProduction, () => bud.sh(`gzip -k -f dist/index.html`));
        });
    }
};
__decorate([
    bind
], BudEmbedded.prototype, "register", null);
BudEmbedded = __decorate([
    label(`@talss89/bud-embedded`),
    options({ body: false }),
    expose(`embedded`)
], BudEmbedded);
export default BudEmbedded;
