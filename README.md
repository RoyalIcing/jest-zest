# jest-zest

Shorter and more readable tests in jest. Combines TypeScript and `Proxy`.

```tsx
import { lazy, freshFn, vary } from 'jest-zest';
import { render } from '@testing-library/react';
import user from '@testing-library/user-event';
import '@testing-library/jest-dom';

const [onAddComment, onEditPost] = freshFn; // Runs mock.mockClear() after every test.
const userKind = vary('normal'); // Can be set to a different value within describes.
const { getByRole, queryByRole } = lazy(() =>
  render(
    <Page
      userKind={userKind()}
      onAddComment={onAddComment}
      onEditPost={onEditPost}
    />
  )
);

it('shows add comment button', () => {
  expect(getByRole('button', { name: 'Add comment' })).toBeVisible();
});

it('hides edit post button', () => {
  expect(queryByRole('button', { name: 'Edit post' })).toBeNull();
});

describe('when add comment is clicked', () => {
  beforeEach(() => {
    user.click(getByRole('button', { name: 'Add comment' }));
  });

  it('calls onAddComment', () => {
    expect(onAddComment).toHaveBeenCalledTimes(1);
  });
});

describe('when user is admin', () => {
  new userKind('admin');
  // OR
  // userKind.current = 'admin';

  it('shows edit post button', () => {
    expect(getByRole('button', { name: 'Edit post' })).toBeVisible();
  });

  describe('when edit post is clicked', () => {
    beforeEach(() => {
      user.click(getByRole('button', { name: 'Edit post' }));
    });

    it('calls onEditPost', () => {
      expect(onEditPost).toHaveBeenCalledTimes(1);
    });
  });
});

userKind.each(['admin', 'editor'])('when user is %s', () => {
  it('shows edit post button', () => {
    expect(getByRole('button', { name: 'Edit post' })).toBeInTheDocument();
  });

  describe('when edit post is clicked', () => {
    beforeEach(() => {
      user.click(getByRole('button', { name: 'Edit post' }));
    });

    it('calls onEditPost', () => {
      expect(onEditPost).toHaveBeenCalledTimes(1);
    });
  });
});
```

## Documentation

### `lazy(creator: () => T, cleanup?: (object?: T) => void)`

Pass a creator function that will be called lazily yet only once. Run `cleanup` callback for each test via `afterEach()`.

Before:

```tsx
import { render } from '@testing-library/react';
import user from '@testing-library/user-event';

const subject = () => render(<CreatePostForm />);

it('shows a form', () => {
  expect(subject().getAllByRole('form')).toHaveLength(1);
});

it('shows content input', () => {
  const { getAllByRole, getByLabelText } = subject();
  expect(getAllByRole('textbox')).toContain(getByLabelText('Content'));
});

it('shows post button', () => {
  expect(subject().getByRole('button', { name: 'Post' })).toBeInTheDocument();
});

it('disables post button', () => {
  expect(subject().getByRole('button', { name: 'Post' })).toBeDisabled();
});

describe('when user types content', () => {
  let result: typeof ReturnType<subject>;
  beforeEach(() => {
    result = subject();
    return user.type(result.getByLabelText('Content'), 'New content');
  });

  it('enables the post button', () => {
    expect(result.getByRole('button', { name: 'Post' })).toBeEnabled();
  });
});
```

After:

```tsx
import { render } from '@testing-library/react';

const { getByRole, getAllByRole, getByLabelText } = lazy(() =>
  render(<CreatePostForm />)
);
const postButton = lazy(() => getByRole('button', { name: 'Post' }));

it('shows a form', () => {
  expect(getAllByRole('form')).toHaveLength(1);
});

it('shows content input', () => {
  expect(getAllByRole('textbox')).toContain(getByLabelText('Content'));
});

it('shows post button', () => {
  expect(postButton()).toBeInTheDocument();
});

it('disables post button', () => {
  expect(postButton()).toBeDisabled();
});

describe('when content is added', () => {
  beforeEach(() => user.type(getByLabelText('Content'), 'New content'));

  it('enables the post button', () => {
    expect(postButton()).toBeDisabled();
  });
});
```

### `fresh(creator: () => T, refresher: (object: T) => void)`

Create multiple of something that must be cleared for each test. Great for spies like `jest.fn()`.

It accepts two arguments:

1. Pass a function that will be called initially to create your object
2. A function that clears the object using `afterEach()`

To then create an instance, either:

- call it to create a single instance
- destructure it like an array to create multiple instances

Before:

```ts
const onChange = jest.fn();
const onFocus = jest.fn();
const onBlur = jest.fn();

afterEach(() => {
  onChange.mockClear();
  onFocus.mockClear();
  onBlur.mockClear();
});
```

After:

```ts
import { fresh } from 'jest-zest';

const [onChange, onFocus, onBlur] = fresh(jest.fn, mock => mock.mockClear());
```

Before:

```ts
const onChange = jest.fn();
const onFocus = jest.fn();
const onBlur = jest.fn();

afterEach(() => {
  onChange.mockClear();
  onFocus.mockClear();
  onBlur.mockClear();
});

const props = {
  onChange,
  onFocus,
  onBlur,
};
```

After:

```ts
import { fresh } from 'jest-zest';

const freshFn = fresh(jest.fn, mock => mock.mockClear());

const props = {
  onChange: freshFn(),
  onFocus: freshFn(),
  onBlur: freshFn(),
};
```

### `freshFn`

After:

```ts
import { freshFn } from 'jest-zest';

const [onChange, onFocus, onBlur] = freshFn;
```

After:

```ts
import { freshFn } from 'jest-zest';

const props = {
  onChange: freshFn(),
  onFocus: freshFn(),
  onBlur: freshFn(),
};
```

### `vary()`

Define and redefine a value easily.

Before:

```tsx
let variation: string;

function subject() {
  return render(<Component variation={variation} />);
}

describe('when variation is orange', () => {
  beforeEach(() => {
    variation = 'orange';
  });

  it('shows text orange', () => {
    expect(subject().getByText('orange')).toBeInTheDocument();
  });
});

describe('when variation is blue', () => {
  beforeEach(() => {
    variation = 'blue';
  });

  it('shows text blue', () => {
    expect(subject().getByText('blue')).toBeInTheDocument();
  });
});
```

After:

```tsx
const kind = vary('');
const subject = lazy(() => render(<Component kind={kind()} />));

describe('when variation is orange', () => {
  new kind('orange');

  it('shows text orange', () => {
    expect(subject.getByText('orange')).toBeInTheDocument();
  });
});

describe('when variation is blue', () => {
  new kind('blue');

  it('shows text blue', () => {
    expect(subject.getByText('blue')).toBeInTheDocument();
  });
});
```

---

This project was bootstrapped with [TSDX](https://github.com/jaredpalmer/tsdx).

## Local Development

Below is a list of commands you will probably find useful.

### `npm start` or `yarn start`

Runs the project in development/watch mode. Your project will be rebuilt upon changes. TSDX has a special logger for you convenience. Error messages are pretty printed and formatted for compatibility VS Code's Problems tab.

Your library will be rebuilt if you make edits.

### `npm run build` or `yarn build`

Bundles the package to the `dist` folder.
The package is optimized and bundled with Rollup into multiple formats (CommonJS, UMD, and ES Module).

### `npm test` or `yarn test`

Runs the test watcher (Jest) in an interactive mode.
By default, runs tests related to files changed since the last commit.
