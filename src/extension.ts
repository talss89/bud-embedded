import {Bud} from '@roots/bud-framework'

import {Extension} from '@roots/bud-framework/extension'
import {
  bind,
  label,
} from '@roots/bud-framework/extension/decorators'

import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

/**
 * Recommended preset
 */
// @dependsOn([`@roots/bud-postcss`])
@label(`@talss89/bud-embedded`)
export default class BudEmbedded extends Extension {
  /**
   * This should be unnecessary in bud 7.0.0 as the user
   * will be required to explicitly install a compiler.
   *
   * {@link Extension.register}
   */
  @bind
  public override async register(bud: Bud) {

    // @ts-ignore
    bud.html({
      title: 'Cantastic Configuration',
      meta: {
        viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
      },
      template: resolve(
        dirname(fileURLToPath(import.meta.url)),
        `..`,
        `vendor`,
        `template.ejs`,
      ),
      minify: !bud.isProduction,
      inject: !bud.isProduction,
      isProduction: bud.isProduction
    })
  }
}
