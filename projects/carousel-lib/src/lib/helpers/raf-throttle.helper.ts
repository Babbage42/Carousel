export function rafThrottle<T extends (...args: any[]) => void>(fn: T): T {
  let scheduled = false,
    lastArgs: any[] | null = null;
  return function (this: any, ...args: any[]) {
    lastArgs = args;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      fn.apply(this, lastArgs as any[]);
      lastArgs = null;
    });
  } as T;
}
