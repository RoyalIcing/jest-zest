export function lazy<T>(
  creator: () => T,
  cleanup?: (object: T) => void
): T & (() => T) {
  let current: T | undefined;

  afterEach(() => {
    if (cleanup && current != null) {
      cleanup(current);
    }
    current = undefined;
  });

  return new Proxy(() => {}, {
    apply() {
      if (!current) {
        current = creator();
      }

      return current;
    },
    get(_obj: {}, prop: keyof T) {
      if (prop === 'calls') {
        return;
      }

      return new Proxy(() => {}, {
        apply(_target, _thisArg, argumentsList) {
          if (!current) {
            current = creator();
          }

          const method = current[prop];
          if (method instanceof Function) {
            return method.apply(current, argumentsList);
          }
        },
      });
    },
  }) as T & (() => T);
}

export function vary<T>(
  initialValue: T
): (() => T) & {
  new (newValue: T): void;
} {
  let currentValue = initialValue;

  beforeEach(() => {
    currentValue = initialValue;
  });

  return new Proxy(() => {}, {
    apply() {
      return currentValue;
    },
    construct(_target: {}, [newValue]) {
      beforeEach(() => {
        currentValue = newValue;
      });
      return {};
    },
  }) as (() => T) & {
    new (newValue: T): void;
  };
}

export function fresh<T>(
  creator: () => T,
  refresher: (object: T) => void
): Array<T> & (() => T) {
  return new Proxy(() => {}, {
    get(_obj: {}, prop) {
      if (prop === 'length') {
        return Infinity;
      }

      if (typeof prop === 'string') {
        const index = parseInt(prop, 10);
        if (index.toString() === prop) {
          const object = creator();
          afterEach(() => {
            refresher(object);
          });
          return object;
        }
      }

      return undefined;
    },
    apply() {
      const object = creator();
      afterEach(() => {
        refresher(object);
      });
      return object;
    },
  }) as Array<T> & (() => T);
}

export const freshFn = fresh(jest.fn, mock => mock.mockClear());
