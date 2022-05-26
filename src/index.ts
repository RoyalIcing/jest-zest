export function lazy<T>(
  creator: () => T,
  cleanup?: (object: T) => void
): T & (() => T) {
  let current: T | undefined;
  function doCreate() {
    if (!current) {
      current = creator();
    }

    return current;
  }

  afterEach(() => {
    if (cleanup && current != null) {
      cleanup(current);
    }
    current = undefined;
  });

  return new Proxy(() => {}, {
    apply() {
      return doCreate();
    },
    get(_obj: {}, prop) {
      if (prop === 'calls') {
        return;
      }

      return new Proxy(() => {}, {
        apply(_target, _thisArg, argumentsList) {
          const receiver = doCreate();

          const method = (receiver as any)[prop];
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

  return new Proxy(Object, {
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
  function create() {
    const object = creator();
    afterEach(() => {
      refresher(object);
    });
    return object;
  }

  const iterable = {
    *[Symbol.iterator]() {
      while (true) {
        yield create();
      }
    },
  };

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

      return (iterable as any)[prop];
    },
    apply() {
      return create();
    },
  }) as Array<T> & (() => T);
}

export const freshFn = fresh(jest.fn, mock => mock.mockClear());
