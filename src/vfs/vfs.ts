import { get, set, del, keys } from 'idb-keyval';

export interface VFSNode {
  name: string;
  type: 'file' | 'dir';
  content?: any;
  parent: string; // path to parent
  updatedAt: number;
}

export const vfs = {
  async init() {
    // Ensure root exists
    if (!(await this.exists('/'))) {
      const node: VFSNode = {
        name: '/',
        type: 'dir',
        parent: '',
        updatedAt: Date.now()
      };
      await set('/', node);
    }
    
    // default folders
    const defaults = ['/home', '/home/documents', '/home/pictures', '/bin', '/trash'];
    for (const path of defaults) {
      if (!(await this.exists(path))) {
        const parts = path.split('/');
        const name = parts.pop() || '';
        const parent = parts.join('/') || '/';
        await this.mkdir(parent === '' ? '/' : parent, name);
      }
    }
  },

  async moveFile(oldPath: string, newPath: string): Promise<void> {
    const node = await this.readFile(oldPath);
    if (!node) throw new Error(`Source not found: ${oldPath}`);

    const parts = newPath.split('/');
    const name = parts.pop() || '';
    const parent = parts.join('/') || '/';

    const newNode: VFSNode = {
      ...node,
      name,
      parent,
      updatedAt: Date.now()
    };

    // If it's a directory, move childreb too
    if (node.type === 'dir') {
      const children = await keys() as string[];
      for (const childKey of children) {
        if (childKey.startsWith(oldPath + '/')) {
          const relativePath = childKey.slice(oldPath.length);
          await this.moveFile(childKey, newPath + relativePath);
        }
      }
    }

    await set(newPath, newNode);
    await del(oldPath);
  },

  async writeFile(path: string, content: any): Promise<void> {
    const parts = path.split('/');
    const name = parts.pop() || '';
    const parent = parts.join('/') || '/';
    
    const node: VFSNode = {
      name,
      type: 'file',
      content,
      parent,
      updatedAt: Date.now()
    };
    await set(path, node);
  },

  async mkdir(parent: string, name: string): Promise<void> {
    const path = parent === '/' ? `/${name}` : `${parent}/${name}`;
    const node: VFSNode = {
      name,
      type: 'dir',
      parent,
      updatedAt: Date.now()
    };
    await set(path, node);
  },

  async readFile(path: string): Promise<VFSNode | undefined> {
    return await get(path);
  },

  async deleteFile(path: string): Promise<void> {
    await del(path);
  },

  async listFiles(directory: string = '/'): Promise<VFSNode[]> {
    const allKeys = await keys() as string[];
    const normalizedDir = directory === '/' ? '/' : (directory.endsWith('/') ? directory : directory + '/');
    
    const childrenKeys = allKeys.filter(key => {
      if (key === directory) return false;
      if (!key.startsWith(directory === '/' ? '/' : normalizedDir)) return false;
      
      const relativePath = key.substring(normalizedDir.length);
      // If there's another slash, it's a grandchild
      return !relativePath.includes('/');
    });

    const results: VFSNode[] = [];
    for (const key of childrenKeys) {
      const node = await get(key);
      if (node) results.push(node);
    }
    return results;
  },

  async exists(path: string): Promise<boolean> {
    const val = await get(path);
    return val !== undefined;
  },

  async getFullPath(node: VFSNode): Promise<string> {
    const parent = node.parent === '/' ? '' : node.parent;
    return `${parent}/${node.name}`;
  }
};
