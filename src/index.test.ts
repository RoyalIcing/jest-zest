import { lazy } from './index';

describe('lazy', () => {
  const creator = jest.fn().mockReturnValue({
    three: 3,
  });
  const subject = lazy(creator);

  beforeEach(() => {
    creator.mockClear();
  });

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

  describe('when it relies on another lazy value', () => {
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
