## jest  API syntax note

1. expect.extend

```js
expect.extend({
  yourMatcher(x, y, z) {
    return {
      pass: true,
      message: () => '',
    };
  },
});
```

2. aysnc matcher

```js
expect.extend({
  async toBeDivisibleByExternalValue(received) {
    const externalValue = await getExternalValueFromRemoteSource();
    const pass = received % externalValue == 0;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be divisible by ${externalValue}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be divisible by ${externalValue}`,
        pass: false,
      };
    }
  },
});

test('is divisible by external value', async () => {
  await expect(100).toBeDivisibleByExternalValue();
  await expect(101).not.toBeDivisibleByExternalValue();
});
```

3. expect.anything() matches anything but null or undefined. 

4. expect.any(constructor) matches anything that was created with the given `constructor`.

```js
function randocall(fn) {
  return fn(Math.floor(Math.random() * 6 + 1));
}

test('randocall calls its callback with a number', () => {
  const mock = jest.fn();
  randocall(mock);
  expect(mock).toBeCalledWith(expect.any(Number));
});
```

5. toThrow()

Note: the function that throws an exception needs to be invoked within a wrapping function otherwise the toThrow assertion will fail.

```js
function compileAndroidCode() {
  throw new Error('you are using the wrong JDK');
}

test('compiling android goes as expected', () => {
  expect(() => compileAndroidCode()).toThrow();
  expect(() => compileAndroidCode()).toThrow(Error);

  // You can also use the exact error message or a regexp
  expect(() => compileAndroidCode()).toThrow('you are using the wrong JDK');
  expect(() => compileAndroidCode()).toThrow(/JDK/);
});
```

## Reference

- https://jestjs.io/docs/en/api