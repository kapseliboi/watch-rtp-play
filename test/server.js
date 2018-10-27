/*
 * Copyright (c) 2018, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

describe('Server', () => {
  let subject
  let Serverful

  beforeEach(() => {
    ({ Serverful } = require('serverful'))
    jest.mock('serverful')

    subject = require('../src/server')
  })

  describe('when exporting', () => {
    it('should be instance of serverful', () => {
      expect(subject).toBeInstanceOf(Serverful)
    })
  })
})
