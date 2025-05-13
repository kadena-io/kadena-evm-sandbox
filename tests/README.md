# tests

To run this you can use node with ts-node or bunjs (easier & faster).

To install dependencies:

```bash
bun install
```

To run tests, we use `--timeout 300000` to increase the timeout to 5 minutes, as
some tests are slow, and they are essentially integration tests.

```bash
bun test --timeout  300000
```
