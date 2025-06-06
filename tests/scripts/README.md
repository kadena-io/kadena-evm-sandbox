# Issue with mining and mempool

- We created a script that submits a transaction.
- Then we manually trigger the mining process
- The script waits for the transaction to be included in a block.
- If the transaction is not included in a block, it will retry until it is
  included.
- The script will print the transaction hash and the block number once the
  transaction is included.

## How to run it

Install the dependencies in this `tests` directory:

```bash
npm install
# or
bun i
```

In this branch we modified the `devnet/docker-compose.yaml`. We changed mining
to `on-demand` mode

```log
  "--worker=on-demand",
```

Start the devnet from the root of the repository:

```bash
./network devnet start
```

Then run the script in `tests` directory to send a basic transaction:

```bash
cd tests && npm run send-basic-tx
# or
cd tests && bun run send-basic-tx
```

This will submit a transaction to the mempool and wait for it to be mined.

In a new terminal: Verify that the transaction is in the mempool:

```bash
./scripts/check-mempool.sh
```

While this is running, run the mining trigger:

```bash
npm run make-blocks
# or
bun run make-blocks
```

Check the cut to see which blocks are mined:

[http://localhost:1848/chainweb/0.0/evm-development/cut](http://localhost:1848/chainweb/0.0/evm-development/cut)

# Expected output

The next block should include the transaction that was submitted by the script.

However, the transaction is not included in the block.

Run the mining trigger again, and the transaction is included in the next block.

```bash
npm run make-blocks
# or
bun run make-blocks
```

# Conclusion

Payload job on EVM is created RIGHT after the block is mined, not before. This
means that the transaction is not included in the block that is mined right
after it is submitted. Instead, it is included in the next block.

**Notice `New payload job created`** is straight after
`Canonical chain committed number=28`

> Because the block can only be mined after 4 parents (it's own and 3 neighbours)
> are mined, the block will take quite some time before it's mined

## Logs

```log
2025-06-06T13:42:15.838761Z  INFO Status connected_peers=0 latest_block=27

2025-06-06T13:42:37.774972Z  INFO State root task finished state_root=0x07959db8c7d5467707b2526034e49929cfdaa399c6f4fd2f68dfe02019a2d933 elapsed=1.721167ms

2025-06-06T13:42:37.775107Z  INFO Block added to canonical chain number=28 hash=0x310a4413e6e5ee30bc736627a6ea1051b41e3ff77013925c5e8b600b61657d72 peers=0 txs=0 gas=0.00 Kgas gas_throughput=0.00 Kgas/second full=0.0% base_fee=0.02gwei blobs=0 excess_blobs=0 elapsed=2.455959ms

2025-06-06T13:42:37.775934Z  INFO Canonical chain committed number=28 hash=0x310a4413e6e5ee30bc736627a6ea1051b41e3ff77013925c5e8b600b61657d72 elapsed=77.5µs

2025-06-06T13:42:37.897196Z  INFO New payload job created id=0x6f8309064210fa71 parent=0x310a4413e6e5ee30bc736627a6ea1051b41e3ff77013925c5e8b600b61657d72

2025-06-06T13:42:40.841413Z  INFO Status connected_peers=0 latest_block=28

2025-06-06T13:43:05.841919Z  INFO Status connected_peers=0 latest_block=28

2025-06-06T13:43:30.844338Z  INFO Status connected_peers=0 latest_block=28

2025-06-06T13:43:55.846358Z  INFO Status connected_peers=0 latest_block=28

2025-06-06T13:44:08.504768Z  INFO State root task finished state_root=0x4d3faf7c9208e81a10f6951a338c886d3fd26af8d2500c8966f902beaa99999b elapsed=1.297917ms

2025-06-06T13:44:08.504871Z  INFO Block added to canonical chain number=29 hash=0x0124eccd7a8c0b1c4d0389f6ad03eca3efa420ae4ff59b0afb5e3ecba2479539 peers=0 txs=2 gas=42.00 Kgas gas_throughput=25.17 Mgas/second full=0.1% base_fee=0.02gwei blobs=0 excess_blobs=0 elapsed=1.668417ms

2025-06-06T13:44:08.505719Z  INFO Canonical chain committed number=29 hash=0x0124eccd7a8c0b1c4d0389f6ad03eca3efa420ae4ff59b0afb5e3ecba2479539 elapsed=32.75µs

2025-06-06T13:44:08.603622Z  INFO New payload job created id=0xba7223f0361638e5 parent=0x0124eccd7a8c0b1c4d0389f6ad03eca3efa420ae4ff59b0afb5e3ecba2479539

2025-06-06T13:44:20.845711Z  INFO Status connected_peers=0 latest_block=29

2025-06-06T13:44:45.848536Z  INFO Status connected_peers=0 latest_block=29

2025-06-06T13:45:10.848115Z  INFO Status connected_peers=0 latest_block=29
```
