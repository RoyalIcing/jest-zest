export function lazyProxy<T>(creator: () => T): T & (() => T) {
  let current: T | undefined;

  beforeEach(() => {
    current = undefined;
  });

  return new Proxy(
    () => {},
    {
      get(_obj: {}, prop: keyof T) {
        if (prop === 'calls') {
          return;
        }

        if (!current) {
          current = creator();
        }

        return current[prop];
      },
      apply() {
        if (!current) {
          current = creator();
        }
  
        return current;
      }
    },
  ) as T & (() => T);
}
