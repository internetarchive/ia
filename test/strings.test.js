import { describe, it, expect } from './test.js'


describe('test strings.js', () => {
  it('concat', () => {
    expect('a'.concat('b')).toEqual('ab')
  })
})

