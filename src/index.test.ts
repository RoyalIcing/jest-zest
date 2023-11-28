import { lazy, vary, fresh, freshFn } from './index';

describe('lazy()', () => {
  const implementation = {
    three: 3,
    methodReturning3times5() {
      return 5 * this.three;
    },
  };
  const creator = jest.fn().mockReturnValue(implementation);
  const cleanupCallback = jest.fn();
  beforeEach(() => {
    creator.mockClear();
    cleanupCallback.mockClear();
  });

  describe('not calling result', () => {
    lazy(creator, cleanupCallback);

    it('has not called cleanup callback', () => {
      expect(cleanupCallback).toHaveBeenCalledTimes(0);
    });
  });

  describe('using result', () => {
    const subject = lazy(creator, cleanupCallback);

    afterAll(() => {
      expect(cleanupCallback).toHaveBeenCalledTimes(1);
    });

    describe('when called as function', () => {
      it('returns value of creator', () => {
        expect(subject()).toBe(implementation);
      });

      it('calls the creator function only once', () => {
        subject();
        subject();
        expect(creator).toHaveBeenCalledTimes(1);
      });
    });

    describe('when getting a property', () => {
      it('returns value of same property from creator', () => {
        expect(subject().three).toEqual(3);
      });

      it('calls the creator function only once', () => {
        subject().three;
        subject().three;
        expect(creator).toHaveBeenCalledTimes(1);
      });
    });

    describe('when getting a method', () => {
      it('returns a function', () => {
        expect(subject.methodReturning3times5).toBeInstanceOf(Function);
      });

      it('returns a different function', () => {
        expect(subject.methodReturning3times5).not.toBe(
          implementation.methodReturning3times5
        );
      });

      it('does not call the creator function', () => {
        subject.methodReturning3times5;
        expect(creator).toHaveBeenCalledTimes(0);
      });

      describe('when calling method', () => {
        it('calls the original method', () => {
          expect(subject.methodReturning3times5()).toEqual(15);
        });

        it('calls the creator function once', () => {
          subject.methodReturning3times5();
          subject.methodReturning3times5();
          expect(creator).toHaveBeenCalledTimes(1);
        });
      });
    });
  });

  describe('when one lazy relies on another lazy value', () => {
    const inner = lazy(() => ({
      isInner: true,
    }));
    const outer = lazy(() => ({
      inner: inner(),
    }));

    it('resolves all', () => {
      expect(outer()).toEqual({ inner: { isInner: true } });
    });
  });
});

describe('vary()', () => {
  describe('override value in test', () => {
    const subject = vary(5);

    it('is 5', () => {
      expect(subject()).toEqual(5);
    });

    describe('override with 9', () => {
      new subject(9);

      it('is 9', () => {
        expect(subject()).toEqual(9);
      });

      describe('override with 12', () => {
        new subject(12);

        it('is 12', () => {
          expect(subject()).toEqual(12);
        });
      });

      it('is still 9', () => {
        expect(subject()).toEqual(9);
      });
    });

    it('is still 5', () => {
      expect(subject()).toEqual(5);
    });

    describe('.each', () => {
      let values: Set<number> = new Set();
      beforeAll(() => {
        values = new Set();
      });
      afterAll(() => {
        expect(Array.from(values).sort()).toEqual([1, 2, 3]);
      });

      subject.each([1, 2, 3])('when value is %s', () => {
        it('has provided value', () => {
          const value = subject();
          expect(value).not.toEqual(5);
          values.add(value);
        });
      });
    });
  });
});

describe('fresh()', () => {
  const objects = fresh(jest.fn, (mock) => mock.mockClear());

  it('has infinite length', () => {
    expect(objects.length).toEqual(Infinity);
  });

  const [a, b, c] = objects;
  it.each([a, b, c])('object is valid mock', (object) => {
    expect(jest.isMockFunction(object)).toBe(true);
  });

  describe('when calling a', () => {
    beforeEach(() => {
      a('argument');
    });

    it('has not called b', () => {
      expect(b).toHaveBeenCalledTimes(0);
    });
  });

  describe('when calling result', () => {
    const result = objects();

    it('is valid mock', () => {
      expect(jest.isMockFunction(result)).toBe(true);
    });
  });
});

describe('freshFn()', () => {
  it('has infinite length', () => {
    expect(freshFn.length).toEqual(Infinity);
  });

  const [a, b, c] = freshFn;
  it.each([a, b, c])('object is mock', (object) => {
    expect(jest.isMockFunction(object)).toBe(true);
  });

  describe('when calling a', () => {
    beforeEach(() => {
      a('argument');
    });

    it('has not called b', () => {
      expect(b).toHaveBeenCalledTimes(0);
    });
  });

  describe('when calling freshFn', () => {
    const result = freshFn();

    it('is mock', () => {
      expect(jest.isMockFunction(result)).toBe(true);
    });
  });
});
