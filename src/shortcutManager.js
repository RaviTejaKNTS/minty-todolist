class ShortcutManager {
  constructor(target = typeof window !== 'undefined' ? window : null) {
    this.target = target;
    this.handlers = new Map(); // combo -> Set of {fn, opts}
    this.handle = this.handle.bind(this);
    if (this.target) this.target.addEventListener('keydown', this.handle);
  }

  normalizeEvent(e) {
    const mods = [];
    if (e.ctrlKey) mods.push('Ctrl');
    if (e.metaKey) mods.push('Meta');
    if (e.altKey) mods.push('Alt');
    if (e.shiftKey) mods.push('Shift');
    let key = e.key;
    if (key.length === 1) key = key.toUpperCase();
    return [...mods, key].join('+');
  }

  normalizeCombo(combo) {
    if (Array.isArray(combo)) return combo.map((c) => this.normalizeCombo(c));
    const parts = combo.split('+').map((p) => p.trim().toLowerCase());
    const key = parts.pop();
    const mods = [];
    const order = ['ctrl', 'meta', 'alt', 'shift'];
    for (const m of order) {
      if (parts.includes(m)) mods.push(m.charAt(0).toUpperCase() + m.slice(1));
    }
    const finalKey = key.length === 1 ? key.toUpperCase() : key[0].toUpperCase() + key.slice(1);
    return [...mods, finalKey].join('+');
  }

  isTypingTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable
    );
  }

  register(combo, fn, opts = {}) {
    const combos = Array.isArray(combo) ? combo : [combo];
    const normalized = combos.map((c) => this.normalizeCombo(c));
    const handler = { fn, opts };
    for (const c of normalized) {
      if (!this.handlers.has(c)) this.handlers.set(c, new Set());
      this.handlers.get(c).add(handler);
    }
    return () => {
      for (const c of normalized) {
        const set = this.handlers.get(c);
        if (set) {
          set.delete(handler);
          if (set.size === 0) this.handlers.delete(c);
        }
      }
    };
  }

  handle(e) {
    const combo = this.normalizeEvent(e);
    const set = this.handlers.get(combo);
    if (!set) return;
    for (const handler of Array.from(set)) {
      if (!handler.opts.allowInInput && this.isTypingTarget(e.target)) continue;
      handler.fn(e);
    }
  }
}

const shortcutManager = new ShortcutManager();
export default shortcutManager;
export const _test = {
  normalizeEvent: (mgr, e) => mgr.normalizeEvent(e),
  normalizeCombo: (mgr, c) => mgr.normalizeCombo(c),
};
