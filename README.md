# jest-zest

Shorter and more readable tests in jest.

```tsx
import { render, fireEvent } from '@testing-library/react';

const userKind = vary('normal');
const [onAddComment, onEditPost] = fresh(jest.fn, mock => mock.mockClear());
const subject = lazy(() =>
  render(
    <Page
      userKind={userKind()}
      onAddComment={onAddComment}
      onEditPost={onEditPost}
    />
  )
);

it('shows add comment button', () => {
  expect(subject.getByText('Add comment')).toBeInTheDocument();
});

describe('when add comment is clicked', () => {
  beforeEach(() => {
    fireEvent.click(subject.getByText('Add comment'));
  });

  it('calls onAddComment', () => {
    expect(onAddComment).toHaveBeenCalledTimes(1);
  });
});

describe('when user is admin', () => {
  userKind('admin');

  it('shows edit post button', () => {
    expect(subject.getByText('Edit post')).toBeInTheDocument();
  });

  describe('when edit post is clicked', () => {
    beforeEach(() => {
      fireEvent.click(subject.getByText('Edit post'));
    });

    it('calls onEditPost', () => {
      expect(onEditPost).toHaveBeenCalledTimes(1);
    });
  });
});
```

## Docs

### `lazy()`

Before:

```tsx
import { render, getRoles } from '@testing-library/react';

const subject = () => render(<CreatePostForm />);

it('shows a form', () => {
  const { getAllByRole } = subject();
  expect(getAllByRole('form')).toHaveLength(1);
});

it('shows content input', () => {
  const { getAllByRole, getByLabelText } = subject();
  expect(getAllByRole('textbox')).toContain(getByLabelText('Content'));
});

it('shows post button', () => {
  const { getAllByRole, getByText } = subject();
  expect(getAllByRole('button')).toContain(getByText('Post'));
});

it('disables post button', () => {
  expect(subject().getByText('Post')).toBeDisabled();
});

describe('when content is added', () => {
  let result: typeof ReturnType<subject>;
  beforeEach(() => {
    result = subject();
    fireEvent.change(result.getByLabelText('Content'), {
      target: { value: 'New content' },
    });
  });

  it('enables the post button', () => {
    expect(result.getByText('Post')).toBeEnabled();
  });
});
```

After:

```tsx
import { render, getRoles } from '@testing-library/react';

const subject = lazy(() => render(<CreatePostForm />));
const roles = lazy(() => getRoles(subject.container));
const postButton = lazy(() => subject.getByText('Post'));

it('shows a form', () => {
  expect(roles.form).toHaveLength(1);
});

it('shows content input', () => {
  expect(roles.textbox).toContain(subject.getByLabelText('Content'));
});

it('shows post button', () => {
  expect(roles.button).toContain(postButton());
});

it('disables post button', () => {
  expect(postButton()).toBeDisabled();
});

describe('when content is added', () => {
  beforeEach(() => {
    fireEvent.change(subject.getByLabelText('Content'), {
      target: { value: 'New content' },
    });
  });

  it('enables the post button', () => {
    expect(postButton()).toBeDisabled();
  });
});
```

### `vary()`

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
  kind('orange');

  it('shows text orange', () => {
    expect(subject.getByText('orange')).toBeInTheDocument();
  });
});

describe('when variation is blue', () => {
  kind('blue');

  it('shows text blue', () => {
    expect(subject.getByText('blue')).toBeInTheDocument();
  });
});
```

### `fresh()`

Before:

```ts
const onChange = jest.fn();
const onFocus = jest.fn();
const onBlur = jest.fn();

beforeEach(() => {
  onChange.mockClear();
  onFocus.mockClear();
  onBlur.mockClear();
});
```

After:

```ts
const [onChange, onFocus, onBlur] = fresh(jest.fn, mock => mock.mockClear());
```

Before:

```ts
const onChange = jest.fn();
const onFocus = jest.fn();
const onBlur = jest.fn();

beforeEach(() => {
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
const freshFn = fresh(jest.fn, mock => mock.mockClear());

const props = {
  onChange: freshFn(),
  onFocus: freshFn(),
  onBlur: freshFn(),
};
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
