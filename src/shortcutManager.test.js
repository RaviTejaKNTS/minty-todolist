import test from 'node:test';
import assert from 'node:assert';
import shortcutManager, { _test } from './shortcutManager.js';

const mgr = shortcutManager;

const { normalizeEvent, normalizeCombo } = _test;

function fakeEvent(key, opts = {}) {
  return { key, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false, target: {}, ...opts };
}

test('normalizeCombo parses modifiers', () => {
  assert.strictEqual(normalizeCombo(mgr, 'ctrl+n'), 'Ctrl+N');
  assert.strictEqual(normalizeCombo(mgr, 'meta+shift+f'), 'Meta+Shift+F');
});

test('normalizeEvent builds combo', () => {
  assert.strictEqual(normalizeEvent(mgr, fakeEvent('n', { ctrlKey: true })), 'Ctrl+N');
  assert.strictEqual(normalizeEvent(mgr, fakeEvent('ArrowUp', { metaKey: true })), 'Meta+ArrowUp');
});

test('register and trigger', () => {
  let called = 0;
  const off = mgr.register(['Ctrl+X', 'Meta+X'], () => called++);
  mgr.handle(fakeEvent('x', { ctrlKey: true }));
  mgr.handle(fakeEvent('x', { metaKey: true }));
  off();
  mgr.handle(fakeEvent('x', { ctrlKey: true }));
  assert.strictEqual(called, 2);
});
