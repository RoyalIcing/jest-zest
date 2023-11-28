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

export function vary<T>(initialValue: T): {
  (): T;
  (newValue: T): void;
  new (newValue: T): void;
  each(variations: ReadonlyArray<T>): ReturnType<typeof describe.each>;
} {
  let currentValue = initialValue;

  beforeEach(() => {
    currentValue = initialValue;
  });

  class Base {
    static each(
      variations: ReadonlyArray<T>
    ): (name: string, fn: () => unknown, timeout?: number) => void {
      return (name, fn, timeout) => {
        describe.each(variations)(
          name,
          (variation) => {
            beforeEach(() => {
              currentValue = variation;
            });

            fn();
          },
          timeout
        );
      };
    }
  }

  return new Proxy(Base, {
    apply(_target, _this, args) {
      if (args.length === 0) {
        return currentValue;
      } else if (args.length === 1) {
        beforeEach(() => {
          currentValue = args[0] as typeof currentValue;
        });
        return;
      } else {
        console.error(args);
        throw Error(
          `Can only call with 0 or 1 args not ${args.length} ${args}.`
        );
      }
    },
    construct(_target: {}, [newValue]) {
      beforeEach(() => {
        currentValue = newValue;
      });
      return {};
    },
  }) as unknown as {
    (): T;
    (newValue: T): void;
    new (newValue: T): void;
    each(variations: ReadonlyArray<T>): ReturnType<typeof describe.each>;
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

export const freshFn = fresh(jest.fn, (mock) => mock.mockClear());
