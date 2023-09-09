import type BudEmbedded from './extension.js'

declare module '@roots/bud-framework' {
  interface Modules {
    'bud-embedded': BudEmbedded
  }

  interface Bud {
    embedded: BudEmbedded
  }
} 
 