/* eslint-disable no-console */

/**
 * Build script for compiling the app UI. This must be run before packaging the app for
 * for distribution. By default, this script will compile the app and start it.
 *
 * Options:
 *  --no-browser: Do not open a browser when running.
 *  --watch: Rebuild and restart app when source files change.
 *  --build-only: Do not run the app after building.
 */
import { watch } from 'chokidar';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

function includeIf(predicate, elem) {
  if (typeof predicate === 'function') {
    return predicate() ? [elem] : [];
  }
  return predicate ? [elem] : [];
}

async function execPrint(command) {
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) {
      console.log(stdout);
    }
    if (stderr) {
      console.error(stderr);
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

async function compile({ targetPath, noBrowser, buildOnly, watch }) {
  try {
    console.log('Compiling TS...');
    await execPrint('npx tsc');
    console.log('Compiling SCSS...');
    await execPrint('npx sass mangareader/src/styles.scss mangareader/build/styles.css');
    if (!buildOnly) {
      console.log('Starting app...');
      const pyArgs = [
        ...includeIf(targetPath, `"${targetPath}"`),
        ...includeIf(noBrowser, '--no-browser'),
      ];
      await execPrint(`python reader.py ${pyArgs.join(' ')}`);
    }
    console.log('Compile successful.');
  } catch (error) {
    console.error('Compile failed.');
    if (!watch) {
      process.exit(1);
    }
  }
}

function processArgs() {
  const [, , ...args] = process.argv;
  const targetPath = args.find((arg) => !arg.startsWith('-'));
  const isNoBrowser = args.includes('--no-browser');
  const isWatch = args.includes('--watch');
  const isBuildOnly = args.includes('--build-only');
  return {
    targetPath,
    noBrowser: isNoBrowser,
    watch: isWatch,
    buildOnly: isBuildOnly,
  };
}

function startWatch(args) {
  const watcher = watch(
    [
      'mangareader/**/*.py',
      'mangareader/**/*.ts',
      'mangareader/**/*.scss',
      'mangareader/**/*.html',
    ],
    {
      persistent: true,
    },
  );
  watcher.on('change', async (path) => {
    console.log('File changed:', path);
    await compile(args);
  });
}

function main() {
  const args = processArgs();
  if (args.watch) {
    startWatch(args);
  }
  compile(args);
}

main();
