const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { test } = require('node:test')
const vm = require('node:vm')

const source = readFileSync(join(__dirname, '..', 'GeniusLyrics.js'), 'utf8')

function runHelper (name, nextName, custom, values = {}) {
  const start = source.indexOf(`  function ${name} (`)
  const end = source.indexOf(`\n  function ${nextName} (`, start)
  assert.ok(start >= 0 && end > start)
  const context = vm.createContext({ custom, input: undefined, pictureInPictureDarkModeMedia: { matches: true }, ...values })
  return vm.runInContext(`${source.slice(start, end)}\n${name}(input)`, context)
}

test('Picture-in-Picture applies safe custom colors and typography', () => {
  const custom = { getPictureInPictureAppearance: () => ({
    backgroundColor: '#381818', textColor: '#eeeeee', highlightColor: '#ffcc00',
    fontFamily: 'Georgia, serif', fontSize: 25
  }) }
  const result = runHelper('getPictureInPictureColors', 'getPictureInPictureActiveLineIndex', custom)
  assert.equal(result.backgroundColor, '#381818')
  assert.equal(result.textColor, '#eeeeee')
  assert.equal(result.highlightColor, '#ffcc00')
  assert.equal(result.fontFamily, 'Georgia, serif')
  assert.equal(result.fontSize, 25)
  assert.equal(result.colorScheme, 'dark')
})

test('Picture-in-Picture rejects invalid style values', () => {
  const custom = { getPictureInPictureAppearance: () => ({
    backgroundColor: 'red; color: blue', textColor: '#12345g',
    highlightColor: 'url(evil)', fontFamily: 'url(evil)', fontSize: 300
  }) }
  const result = runHelper('getPictureInPictureColors', 'getPictureInPictureActiveLineIndex', custom)
  assert.equal(result.backgroundColor, '#000000')
  assert.equal(result.textColor, '#ffffff')
  assert.equal(result.highlightColor, '#1ed760')
  assert.equal(result.fontFamily, 'system-ui, sans-serif')
  assert.equal(result.fontSize, 0)
})

test('Picture-in-Picture selects the intended repeated line', () => {
  const custom = { getPictureInPictureActiveLine: () => ({ text: 'Say yes, say yes!', occurrence: 1 }) }
  const lines = ['[Chorus]', 'Say yes, say yes', 'Another line', 'Say yes, say yes']
  assert.equal(runHelper('getPictureInPictureActiveLineIndex', 'getPictureInPictureDesiredScrollTop', custom, { input: lines }), 3)
  custom.getPictureInPictureActiveLine = () => null
  assert.equal(runHelper('getPictureInPictureActiveLineIndex', 'getPictureInPictureDesiredScrollTop', custom, { input: lines }), -1)
})
