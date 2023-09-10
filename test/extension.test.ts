import {describe, expect, it} from 'vitest'

import Extension from '../src/index.js'

describe(`bud-embedded`, () => {
  it(`should be constructable`, () => {
    expect(Extension).toBeInstanceOf(Function)
  })
})
