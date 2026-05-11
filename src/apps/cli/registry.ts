import { path } from '../../libs/path';

export type CLIContext = {
  cwd: string;
  fs: any;
  kernel: any;
  print: (msg: string, type?: 'output' | 'error') => void;
  setCwd: (path: string) => void;
  programs: CLIProgram[];
};

export type CLIProgram = {
  name: string;
  description: string;
  execute: (args: string[], context: CLIContext) => Promise<void>;
};

export const help: CLIProgram = {
  name: 'help',
  description: 'List available commands',
  execute: async (_args, { print, programs }) => {
    print('VirtuOS CLI Programs:');
    print('---------------------');
    if (programs && programs.length > 0) {
      print(programs.map(p => p.name).join(', '));
    } else {
      print('help, ls, cd, cat, mkdir, rm, echo, pwd, whoami, vpkg, python, node, git, install, jelly');
    }
  }
};

export const ls: CLIProgram = {
  name: 'ls',
  description: 'List directory contents',
  execute: async (_args, { cwd, fs, print }) => {
    try {
      const items = await fs.listFiles(cwd);
      if (items.length === 0) {
        print('(directory empty)');
      } else {
        print(items.map((item: any) => item.type === 'dir' ? `[DIR] ${item.name}` : item.name).join('  '));
      }
    } catch (err) {
      print('Error listing files', 'error');
    }
  }
};

export const cd: CLIProgram = {
  name: 'cd',
  description: 'Change directory',
  execute: async (args, { cwd, fs, print, setCwd }) => {
    const target = args[0] || '/home';
    const newPath = path.resolve(cwd, target);
    if (await fs.exists(newPath)) {
      const node = await fs.readFile(newPath);
      if (node?.type === 'dir') {
        setCwd(newPath);
      } else {
        print(`cd: ${target}: Not a directory`, 'error');
      }
    } else {
      print(`cd: ${target}: No such file or directory`, 'error');
    }
  }
};

export const cat: CLIProgram = {
  name: 'cat',
  description: 'Concatenate and print files',
  execute: async (args, { cwd, fs, print }) => {
    const target = args[0];
    if (!target) {
      print('Usage: cat [filename]', 'error');
      return;
    }
    const filePath = path.resolve(cwd, target);
    const node = await fs.readFile(filePath);
    if (node && node.type === 'file') {
      print(node.content || '');
    } else {
      print(`cat: ${target}: No such file`, 'error');
    }
  }
};

export const pwd: CLIProgram = {
  name: 'pwd',
  description: 'Print working directory',
  execute: async (_args, { cwd, print }) => {
    print(cwd);
  }
};

export const whoami: CLIProgram = {
  name: 'whoami',
  description: 'Print current user',
  execute: async (_args, { print, kernel }) => {
    print(kernel.user?.username || 'virtuos-user');
  }
};

export const echo: CLIProgram = {
  name: 'echo',
  description: 'Display a line of text',
  execute: async (args, { cwd, fs, print }) => {
    const text = args.join(' ');
    if (text.includes('>')) {
      const [content, fileName] = text.split('>').map(s => s.trim());
      const filePath = path.resolve(cwd, fileName);
      await fs.writeFile(filePath, content);
      print(`Written to ${fileName}`);
    } else {
      print(text);
    }
  }
};

export const mkdir: CLIProgram = {
  name: 'mkdir',
  description: 'Make directories',
  execute: async (args, { cwd, fs, print }) => {
    const name = args[0];
    if (!name) {
      print('Usage: mkdir [directory_name]', 'error');
      return;
    }
    await fs.mkdir(cwd, name);
    print(`Directory "${name}" created.`);
  }
};

export const rm: CLIProgram = {
  name: 'rm',
  description: 'Remove files or directories',
  execute: async (args, { cwd, fs, print }) => {
    const name = args[0];
    if (!name) {
      print('Usage: rm [name]', 'error');
      return;
    }
    const targetPath = path.resolve(cwd, name);
    if (await fs.exists(targetPath)) {
      await fs.deleteFile(targetPath);
      print(`Removed "${name}".`);
    } else {
      print(`rm: ${name}: No such file or directory`, 'error');
    }
  }
};

export const install: CLIProgram = {
  name: 'install',
  description: 'Install a script to /bin',
  execute: async (args, { cwd, fs, print }) => {
    const fileName = args[0];
    if (!fileName) {
      print('Usage: install [filename]', 'error');
      return;
    }
    const sourcePath = path.resolve(cwd, fileName);
    const node = await fs.readFile(sourcePath);
    if (!node || node.type !== 'file') {
      print(`install: ${fileName}: No such file`, 'error');
      return;
    }
    
    const cmdName = fileName.replace(/\.[^/.]+$/, "");
    await fs.writeFile(`/bin/${cmdName}`, node.content);
    print(`Successfully installed "${cmdName}" to /bin`);
  }
};

export const vpkg: CLIProgram = {
  name: 'vpkg',
  description: 'VirtuOS Package Manager',
  execute: async (args, { print, kernel }) => {
    const command = args[0];
    const pkgName = args[1];

    if (!command || !['install', 'remove', 'list'].includes(command)) {
      print('Usage: vpkg [install|remove|list] [package_name]', 'error');
      return;
    }

    if (command === 'list') {
      print('Available packages:');
      print(' - python, node, git, docker');
      return;
    }

    if (!pkgName) {
      print('Please specify a package name.', 'error');
      return;
    }

    if (command === 'install') {
      print(`Fetching ${pkgName}...`);
      await new Promise(r => setTimeout(r, 1000));
      print(`${pkgName} installed successfully!`);
      kernel.addNotification({
        title: 'Package Installed',
        message: `${pkgName} is now available.`,
        type: 'success'
      });
    } else if (command === 'remove') {
      print(`Removing ${pkgName}...`);
      await new Promise(r => setTimeout(r, 500));
      print(`${pkgName} removed.`);
    }
  }
};

export const python: CLIProgram = {
  name: 'python',
  description: 'Python Simulator',
  execute: async (args, { print, fs, cwd }) => {
    if (args.length === 0) {
      print('VirtuOS Python 3.10');
      return;
    }
    const script = args[0];
    const filePath = script.startsWith('/') ? script : `${cwd}/${script}`.replace(/\/+/g, '/');
    const file = await fs.readFile(filePath);
    if (file && file.type === 'file') {
      print(`Python executing ${script}...`);
      const lines = file.content.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('print')) {
          const m = line.match(/print\((['"])(.*)\1\)/);
          if (m) print(m[2]);
        }
      }
    } else {
      print(`python: can't open file '${script}'`, 'error');
    }
  }
};

export const node: CLIProgram = {
  name: 'node',
  description: 'Node.js Simulator',
  execute: async (args, { print, fs, cwd }) => {
    if (args.length === 0) {
      print('Welcome to Node.js');
      return;
    }
    const script = args[0];
    const filePath = script.startsWith('/') ? script : `${cwd}/${script}`.replace(/\/+/g, '/');
    const file = await fs.readFile(filePath);
    if (file && file.type === 'file') {
      try {
        const sandbox = { console: { log: (...a: any[]) => print(a.join(' ')) } };
        const fn = new Function('console', file.content);
        fn(sandbox.console);
      } catch (e: any) {
        print(`RuntimeError: ${e.message}`, 'error');
      }
    } else {
      print(`node: can't open file '${script}'`, 'error');
    }
  }
};

export const git: CLIProgram = {
  name: 'git',
  description: 'Git Simulator',
  execute: async (args, { print }) => {
    const command = args[0];
    if (!command) {
      print('usage: git <command>');
      return;
    }
    print(`git ${command} simulated.`);
  }
};

export const jelly: CLIProgram = {
  name: 'jelly',
  description: 'Toggle jelly window animation',
  execute: async (args, { print, kernel }) => {
    const arg = args[0]?.toLowerCase();
    if (!arg) {
      print(`Jelly animation is currently ${kernel.enableJellyAnimation ? 'ON' : 'OFF'}`);
      print('Usage: jelly [on|off]');
      return;
    }

    if (arg === 'on') {
      kernel.setEnableJellyAnimation(true);
      print('Jelly animation enabled');
    } else if (arg === 'off') {
      kernel.setEnableJellyAnimation(false);
      print('Jelly animation disabled');
    } else {
      print(`Invalid argument: ${arg}. Use "on" or "off"`, 'error');
    }
  }
};

export const CLI_REGISTRY: Record<string, CLIProgram> = {
  help, ls, cd, cat, mkdir, rm, echo, pwd, whoami, install, vpkg, python, node, git, jelly
};

export const getCLIProgram = (name: string): CLIProgram | undefined => {
  return CLI_REGISTRY[name];
};

export const getAllCLIPrograms = (): CLIProgram[] => {
  return Object.values(CLI_REGISTRY);
};
