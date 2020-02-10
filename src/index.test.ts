import { lazyProxy } from './index';

describe('lazyProxy', () => {
  const creator = jest.fn().mockReturnValue({
    three: 3,
  });
  const subject = lazyProxy(creator);

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
});
