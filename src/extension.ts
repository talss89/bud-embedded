import {Bud} from '@roots/bud-framework'

import {Extension} from '@roots/bud-framework/extension'
import {
  bind,
  label,
  options,
} from '@roots/bud-framework/extension/decorators'

import {expose} from '@roots/bud-framework/extension/decorators/expose'

// import {dirname, resolve} from 'node:path'
// import {fileURLToPath} from 'node:url'

interface Options {
  body: string | false
}

@label(`@talss89/bud-embedded`)
@options<Options>({body: false})
@expose(`embedded`)
export default class BudEmbedded extends Extension<Options> {

  public declare getBody: () => string

  public declare setBody: (body: string) => this

  @bind
  public override async register(bud: Bud) {
    console.error(this.options)
    // @ts-ignore
    // bud.html({
    //   appHtml: this.options.body ? bud.path(this.options.body) : null,
    //   template: resolve(
    //     dirname(fileURLToPath(import.meta.url)),
    //     `..`,
    //     `vendor`,
    //     `template.ejs`,
    //   ),
    //   minify: !bud.isProduction,
    //   inject: !bud.isProduction,
    //   isProduction: bud.isProduction
    // })

    // bud.after(async () => { 
    //   await bud.when(bud.isProduction, () => bud.sh(`gzip -k -f dist/index.html`))
    // });

  }

}