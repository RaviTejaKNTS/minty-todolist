import { useEffect, useCallback } from 'react';

// Cross-platform key detection
const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
const metaKey = isMac ? 'metaKey' : 'ctrlKey';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  meta?: boolean;
  alt?: boolean;
  preventDefault?: boolean;
  description: string;
  category: 'global' | 'editor';
}

export interface ShortcutHandler {
  config: ShortcutConfig;
  handler: (event: KeyboardEvent) => void;
}

class ShortcutManager {
  private shortcuts: Map<string, ShortcutHandler> = new Map();
  private isEnabled = true;
  private activeContext: 'global' | 'editor' = 'global';

  register(id: string, config: ShortcutConfig, handler: (event: KeyboardEvent) => void) {
    this.shortcuts.set(id, { config, handler });
  }

  unregister(id: string) {
    this.shortcuts.delete(id);
  }

  setContext(context: 'global' | 'editor') {
    this.activeContext = context;
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  private createKeyString(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.metaKey) parts.push('meta');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    
    // Normalize key names
    let key = event.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === 'arrowup') key = 'up';
    if (key === 'arrowdown') key = 'down';
    if (key === 'arrowleft') key = 'left';
    if (key === 'arrowright') key = 'right';
    
    parts.push(key);
    return parts.join('+');
  }

  private matchesShortcut(event: KeyboardEvent, config: ShortcutConfig): boolean {
    const eventKey = event.key.toLowerCase();
    const configKey = config.key.toLowerCase();
    
    // Handle special keys
    if (configKey === 'space' && eventKey !== ' ') return false;
    if (configKey !== 'space' && eventKey !== configKey) return false;
    
    // Check modifiers - use cross-platform detection
    const hasCtrl = isMac ? event.metaKey : event.ctrlKey;
    const hasMeta = isMac ? event.ctrlKey : event.metaKey;
    
    if (config.ctrl && !hasCtrl) return false;
    if (!config.ctrl && hasCtrl) return false;
    
    if (config.meta && !hasMeta) return false;
    if (!config.meta && hasMeta) return false;
    
    if (config.shift && !event.shiftKey) return false;
    if (!config.shift && event.shiftKey) return false;
    
    if (config.alt && !event.altKey) return false;
    if (!config.alt && event.altKey) return false;
    
    return true;
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if (!this.isEnabled) return;

    // Skip if typing in input fields (except for specific shortcuts)
    const target = event.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
    
    for (const [id, { config, handler }] of this.shortcuts) {
      // Only process shortcuts for the current context
      if (config.category !== this.activeContext) continue;
      
      if (this.matchesShortcut(event, config)) {
        // Allow certain shortcuts even in input fields
        const allowInInput = ['escape', 'enter'].includes(config.key.toLowerCase()) || 
                           (config.ctrl && ['f', 'n'].includes(config.key.toLowerCase()));
        
        if (isInputField && !allowInInput) continue;
        
        if (config.preventDefault !== false) {
          event.preventDefault();
          event.stopPropagation();
        }
        
        handler(event);
        return;
      }
    }
  };

  getShortcuts(): ShortcutHandler[] {
    return Array.from(this.shortcuts.values());
  }

  getShortcutDisplay(config: ShortcutConfig): string {
    const parts: string[] = [];
    
    if (config.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
    if (config.shift) parts.push('⇧');
    if (config.alt) parts.push(isMac ? '⌥' : 'Alt');
    if (config.meta && !isMac) parts.push('Meta');
    
    let key = config.key;
    if (key === 'space') key = 'Space';
    if (key === 'up') key = '↑';
    if (key === 'down') key = '↓';
    if (key === 'left') key = '←';
    if (key === 'right') key = '→';
    if (key === 'delete') key = isMac ? 'Fn+Delete' : 'Delete';
    
    parts.push(key.toUpperCase());
    return parts.join('+');
  }
}

// Global instance
export const shortcutManager = new ShortcutManager();

export function useKeyboardShortcuts() {
  useEffect(() => {
    document.addEventListener('keydown', shortcutManager.handleKeyDown);
    return () => {
      document.removeEventListener('keydown', shortcutManager.handleKeyDown);
    };
  }, []);

  const registerShortcut = useCallback((id: string, config: ShortcutConfig, handler: (event: KeyboardEvent) => void) => {
    shortcutManager.register(id, config, handler);
    return () => shortcutManager.unregister(id);
  }, []);

  const setContext = useCallback((context: 'global' | 'editor') => {
    shortcutManager.setContext(context);
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    shortcutManager.setEnabled(enabled);
  }, []);

  return {
    registerShortcut,
    setContext,
    setEnabled,
    manager: shortcutManager
  };
}