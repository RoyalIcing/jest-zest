import { lazy, vary, fresh } from './index';

describe('lazy', () => {
  const creator = jest.fn().mockReturnValue({
    three: 3,
  });
  beforeEach(() => {
    creator.mockClear();
  });
  const subject = lazy(creator);

  describe('when called as function', () => {
    it('returns value of creator', () => {
      expect(subject()).toEqual({ three: 3 });
    });

    it('calls the creator function only once', () => {
      subject();
      subject();
      expect(creator).toHaveBeenCalledTimes(1);
    });
  });

  describe('when getting a property', () => {
    it('returns value of same property from creator', () => {
      expect(subject.three).toEqual(3);
    });

    it('calls the creator function only once', () => {
      subject.three;
      subject.three;
      expect(creator).toHaveBeenCalledTimes(1);
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
  });
});

describe('fresh()', () => {
  const objects = fresh(jest.fn, mock => mock.mockClear());

  it('has infinite length', () => {
    expect(objects.length).toEqual(Infinity);
  });

  const [a, b, c] = objects;
  it.each([a, b, c])('object is mock', object => {
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

  describe("when calling result", () => {
    const result = objects();

    it("is mock", () => {
      expect(jest.isMockFunction(result)).toBe(true);
    })
  })
});
