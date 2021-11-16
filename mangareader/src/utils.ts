/**
 * GENERIC UTILITY FUNCTIONS
 */
function onIntersectChange(
  targetIntersectHandler: (t: HTMLElement) => void,
  { threshold, rootMargin }: { threshold: number; rootMargin?: string },
): IntersectionObserver {
  return new IntersectionObserver(
    (entries) => {
      entries
        .filter((entry) => entry.intersectionRatio > threshold)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        .map((entry) => entry.target as HTMLElement)
        .forEach((target, index) => {
          if (!index) {
            targetIntersectHandler(target);
          }
        });
    },
    { threshold: [threshold], rootMargin },
  );
}

function asyncTimeout(millis: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), millis);
  });
}

/**
 * Returns a throttled version of a given input function, which will be executed at most once
 * every `millis` milliseconds. At the end of each period, the most recent invocation will be
 * executed. Execution also happens immediately if invoked while no throttle window is in
 * progress.
 * @param {(...args: any[]) => void} func Function to be throttled
 * @param {number} millis Throttle time in milliseconds
 */
function throttle<T extends (...args: any[]) => void>(func: T, millis: number) {
  let active: boolean;
  let lastArgs: Parameters<T>;
  let count: number;
  return async (...args: Parameters<T>) => {
    if (!active) {
      active = true;
      lastArgs = args;
      func(...args);
      count = 0;
      while (true) {
        await asyncTimeout(millis);
        if (count) {
          count = 0;
          func(...lastArgs);
        } else {
          break;
        }
      }
      // eslint-disable-next-line require-atomic-updates
      active = false;
    } else {
      count++;
      lastArgs = args;
    }
  };
}

/**
 * Basic semver comparator. Only works with numbers, e.g. 1.2.1. Returns positive if target newer
 * than source, negative if target older than source, or zero if equal.
 * @param {string} source
 * @param {string} target
 */
function versionComparator(source: SemVer, target: SemVer): number {
  const sourceParts = source.split('.').map((num) => parseInt(num, 10));
  const targetParts = target.split('.').map((num) => parseInt(num, 10));

  const recursor = (s: number[], t: number[]): number => {
    if (!s.length && !t.length) {
      return 0;
    } else if (!s.length) {
      return t[0] || 0;
    } else if (!t.length) {
      return -(s[0] || 0);
    }

    const diff = (t as [number])[0] - (s as [number])[0];
    return diff === 0 ? recursor(s.slice(1), t.slice(1)) : diff;
  };

  return recursor(sourceParts, targetParts);
}

interface AnimationDispatcher {
  /**
   * Add a task to be executed on the next animation frame, after which it is removed.
   * @param label Identifier for the task. If more than one task with the same label are
   * scheduled before the next animation frame, only the most recently scheduled one will be run.
   * @param task Callback function to execute on the next animation frame.
   */
  addTask(label: string, task: () => void): void;
  /**
   * Add a watcher that will be executed on every animation frame.
   * @param label Identifier for the watcher. Adding a watcher with the same name as an existing
   * one overwrites it.
   * @param watcher Callback function to execute on each animation frame. Set to a null value to
   * remove the watcher with the specified label.
   */
  setWatcher(label: string, watcher: () => void | void): void;
}

/**
 * Creates a wrapper around `requestAnimationFrame` to enable a simpler task-based API for using
 * it.
 *
 * @see AnimationDispatcher
 */
function createAnimationDispatcher(): AnimationDispatcher {
  let tasks: Record<string, () => void> = {};
  const watchers: Record<string, () => void> = {};
  const loop = () => {
    for (const task of Object.values(tasks)) {
      task();
    }
    tasks = {};
    for (const watcher of Object.values(watchers)) {
      watcher();
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  return {
    addTask: (label: string, task: () => void) => {
      tasks[label] = task;
    },
    setWatcher: (label: string, watcher: () => void | void) => {
      if (!watcher) {
        delete watchers[label];
      } else {
        watchers[label] = watcher;
      }
    },
  };
}
