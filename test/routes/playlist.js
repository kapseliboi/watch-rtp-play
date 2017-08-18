/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { readFileSync } = require('fs')
const { join } = require('path')

describe('Playlist', () => {
  let subject
  let HTTPRequest
  let Logger

  before(() => {
    HTTPRequest = td.object([ 'get' ])

    Logger = td.object([ 'error' ])
  })

  afterEach(() => td.reset())

  describe('when handling a request for a TV playlist', () => {
    const channel = 'my-channel'
    let channels
    const url = `https://streaming-live.rtp.pt/liverepeater/smil:${channel}.smil/playlist.m3u`
    const headers = { 'Referer': `http://www.rtp.pt/play/direto/${channel}` }
    const proxy = false
    const query = { channel, proxy }
    const host = 'my-host'
    const connection = { info: { protocol: 'http' } }
    const info = { host }
    const request = { query, headers: {}, info, connection }
    let reply
    const playlistResponse = { body: readFileSync(join(__dirname, './tv-playlist-response-ok.m3u8')).toString() }

    beforeEach(() => {
      channels = td.object([ channel ])
      td.replace('../../src/channels.json', channels)
      channels[ channel ] = { is_tv: true }

      reply = td.function()

      td.replace('../../src/http-request', HTTPRequest)
      td.when(HTTPRequest.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenResolve(playlistResponse)

      subject = require('../../src/routes/playlist')
    })

    it('should call HTTPRequest get', () => {
      subject.handler(request, reply)

      td.verify(HTTPRequest.get(url, headers, proxy), { times: 1 })
    })

    it('should reply with a modified playlist', () => {
      const replyBody = readFileSync(join(__dirname, './modified-tv-playlist.m3u8')).toString()

      return subject.handler(request, reply)
        .then(() => {
          td.verify(reply(null, replyBody), { times: 1 })
        })
    })
  })

  describe('when handling a request that fails for a TV playlist', () => {
    const channel = 'my-channel'
    let channels
    const proxy = false
    const query = { channel, proxy }
    const host = 'my-host'
    const connection = { info: { protocol: 'http' } }
    const info = { host }
    const request = { query, headers: {}, info, connection }
    let reply
    const error = new Error('my-message')

    beforeEach(() => {
      channels = td.object([ channel ])
      td.replace('../../src/channels.json', channels)
      channels[ channel ] = { is_tv: true }

      reply = td.function()

      td.replace('../../src/http-request', HTTPRequest)
      td.when(HTTPRequest.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenReject(error)

      td.replace('modern-logger', Logger)

      subject = require('../../src/routes/playlist')
    })

    it('should return 500', () => {
      return subject.handler(request, reply)
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(reply(captor.capture()), { times: 1 })

          const _error = captor.value
          _error.should.have.property('isBoom')
          _error.should.be.instanceOf(Error)
          _error.isBoom.should.be.equal(true)
          _error.message.should.contain(error.message)
          _error.output.statusCode.should.be.equal(500)
        })
    })
  })

  describe('when handling a request for a radio playlist', () => {
    const channel = 'my-channel'
    const channelName = 'my-channel-name'
    let channels
    const url = `http://streaming-live.rtp.pt/liveradio/${channelName}/playlist.m3u8?DVR`
    const headers = { 'Referer': `http://www.rtp.pt/play/direto/${channel}` }
    const proxy = false
    const query = { channel, proxy }
    const host = 'my-host'
    const connection = { info: { protocol: 'http' } }
    const info = { host }
    const request = { query, headers: {}, info, connection }
    let reply
    const playlistResponse = { body: readFileSync(join(__dirname, './radio-playlist-response-ok.m3u8')).toString() }

    beforeEach(() => {
      channels = td.object([ channel ])
      td.replace('../../src/channels.json', channels)
      channels[ channel ] = { is_tv: false, name: channelName }

      reply = td.function()

      td.replace('../../src/http-request', HTTPRequest)
      td.when(HTTPRequest.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenResolve(playlistResponse)

      subject = require('../../src/routes/playlist')
    })

    it('should call HTTPRequest get', () => {
      subject.handler(request, reply)

      td.verify(HTTPRequest.get(url, headers, proxy), { times: 1 })
    })

    it('should reply with a modified playlist', () => {
      const replyBody = readFileSync(join(__dirname, './modified-radio-playlist.m3u8')).toString()

      return subject.handler(request, reply)
        .then(() => {
          td.verify(reply(null, replyBody), { times: 1 })
        })
    })
  })

  describe('when handling a request that fails for a radio playlist', () => {
    const channel = 'my-channel'
    let channels
    const proxy = false
    const query = { channel, proxy }
    const host = 'my-host'
    const connection = { info: { protocol: 'http' } }
    const info = { host }
    const request = { query, headers: {}, info, connection }
    let reply
    const error = new Error('my-message')

    beforeEach(() => {
      channels = td.object([ channel ])
      td.replace('../../src/channels.json', channels)
      channels[ channel ] = { is_tv: false }

      reply = td.function()

      td.replace('../../src/http-request', HTTPRequest)
      td.when(HTTPRequest.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenReject(error)

      td.replace('modern-logger', Logger)

      subject = require('../../src/routes/playlist')
    })

    it('should return 500', () => {
      return subject.handler(request, reply)
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(reply(captor.capture()), { times: 1 })

          const _error = captor.value
          _error.should.have.property('isBoom')
          _error.should.be.instanceOf(Error)
          _error.isBoom.should.be.equal(true)
          _error.message.should.contain(error.message)
          _error.output.statusCode.should.be.equal(500)
        })
    })
  })

  describe('when handling a request for a playlist that does not exist', () => {
    const channel = 'my-channel'
    let channels
    const proxy = false
    const query = { channel, proxy }
    const host = 'my-host'
    const info = { host }
    const request = { query, headers: {}, info }
    let reply

    beforeEach(() => {
      channels = td.object([])
      td.replace('../../src/channels.json', channels)

      reply = td.function()

      subject = require('../../src/routes/playlist')
    })

    it('should return 400', () => {
      subject.handler(request, reply)

      const captor = td.matchers.captor()

      td.verify(reply(captor.capture()), { times: 1 })

      const error = captor.value
      error.should.have.property('isBoom')
      error.should.be.instanceOf(Error)
      error.isBoom.should.be.equal(true)
      error.message.should.contain(error.message)
      error.output.statusCode.should.be.equal(400)
    })
  })

  describe('when configuring authentication', () => {
    beforeEach(() => {
      subject = require('../../src/routes/playlist')
    })

    it('should not require authenticate', () => {
      const auth = subject.auth()

      auth.should.be.equal(false)
    })
  })

  describe('when configuring validate', () => {
    beforeEach(() => {
      subject = require('../../src/routes/playlist')
    })

    it('should validate query params', () => {
      const result = subject.validate()

      result.should.have.property('query')
      result.query.should.have.all.keys([ 'channel', 'proxy' ])
    })
  })

  describe('when configuring cors', () => {
    beforeEach(() => {
      subject = require('../../src/routes/playlist')
    })

    it('should allow any origin', () => {
      const result = subject.cors()

      result.should.have.property('origin')
      result.origin.should.include('*')
    })
  })
})