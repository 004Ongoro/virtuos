/**
 * Lightweight Path Utility for VirtuOS
 * Handles path normalization, joining, and resolution in the browser.
 */

export const path = {
  /**
   * Normalizes a path, resolving '..' and '.' segments.
   */
  normalize(pathStr: string): string {
    if (!pathStr) return '/';
    
    const isAbsolute = pathStr.startsWith('/');
    const parts = pathStr.split('/').filter(Boolean);
    const stack: string[] = [];

    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        if (stack.length > 0) stack.pop();
      } else {
        stack.push(part);
      }
    }

    const result = stack.join('/');
    return isAbsolute ? '/' + result : result || '.';
  },

  /**
   * Joins multiple path segments into one.
   */
  join(...segments: string[]): string {
    return this.normalize(segments.filter(Boolean).join('/'));
  },

  /**
   * Resolves relative paths against a base path.
   */
  resolve(base: string, relative: string): string {
    if (relative.startsWith('/')) return this.normalize(relative);
    return this.join(base, relative);
  },

  /**
   * Gets the directory name of a path.
   */
  dirname(pathStr: string): string {
    const normalized = this.normalize(pathStr);
    if (normalized === '/') return '/';
    const parts = normalized.split('/');
    parts.pop();
    const dir = parts.join('/');
    return dir === '' ? '/' : dir;
  },

  /**
   * Gets the last portion of a path.
   */
  basename(pathStr: string): string {
    const parts = this.normalize(pathStr).split('/');
    return parts.pop() || '';
  },

  /**
   * Splits path into directory and name.
   */
  split(pathStr: string): { dir: string; name: string } {
    return {
      dir: this.dirname(pathStr),
      name: this.basename(pathStr)
    };
  }
};
