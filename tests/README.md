# tests

To run this you can use [`bunjs`](https://bun.sh/) (easier & faster).

You can run it with NodeJS as well, but it's not setup for that yet.

## Getting started

Install [`bunjs`](https://bun.sh/) if you don't have it already.

Install dependencies

```bash
bun install
```

Run the tests

```bash
bun run test
```

## Technical understanding

### Timeout 30000

We run the tests with `--timeout 30000` (5 minutes) to give the tests enough
time to run. Traditionally the tests are unit-tests, but in this case we are
using it as integration tests which take longer to run.
