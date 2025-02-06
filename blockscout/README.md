# Run Blockscout for Chainweb EVMs

This folder provides a docker compose setup for running separate
[Blockscout](blockscout.com) instances for each EVM chain in a local Chainweb
devnet.

Each Blockscout instance runs in separate docker compose project in addtion to
the docker compose project for the Chainweb devnet. All state is persisted in
docker volumes.

The Blockscout instances connect to the devnet via the hostnetwork.

# Quick Start

Make sure that that Docker is provided with sufficent amounts of RAM and CPU
cores. At least 6 cores and 12GB of RAM are recommended.

Assuming the current working dir is the root of the repository,

1.  run the Chainweb devnet:

    ```sh
    cd compose
    docker compose up -d
    ```

2.  switch to the Blockscout project folder:

    ```sh
    cd ../blockscout-compose
    ```

3.  start Blockscout instance for chain 0:

    ```sh
    docker compose -f chain-0.yaml up -d
    ```

4.  start Blockscout instance for chain 1:
  
   ```sh
   docker compose -f chain-1.yaml up -d
   ```

5.  Navigate to the Blockscout UI:

    *   open [site for chain 0](http://localhost:8000)
    *   open [site for chain 1](http://localhost:8001)

    If you get 502 status code, wait a while and rety. In particular on macos,
    docker networking can sometimes cause long latencies on DNS lookups for
    external connections. This can affect the startup of the Blockscout frontend
    component. It can help to reverse the order above and first start the
    Blockscout instances before starting the Chainweb Devnet.

# Shutting down

```sh
docker compose -f chain-0.yaml down -v --remove-orphans
docker compose -f chain-1.yaml down -v --remove-orphans
```

# Verify Contracts

Verification of contracts allows Blockscout to provide more detailed and richer
information about the contract and associtated transactions and logs.

Verification can be done directly from the hardhat project.

1.  Switch to the Hardhat Solidity project folder:

    ```sh
    cd ../solidity
    ```

2.  Run the verification: obtain the address of the contract that you want
    verify and run

    ```sh
    npx hardhat verify --network kadena_devnet$CHAIN $ADDRESS $ARG0 $ARG1 ...
    ```

    where
    *   `$CHAIN` is the chain on which the contract is deployed (0 or 1)
    *   `$ADDRESS` is the address of the contract, and
    *   `$ARG0` ... `ARGN` are the constructor arguments of the contract.


    Example:

    ```sh
    npx hardhat verify --network kadena_devnet0 0x5dF2915A55dF72104c5286aFBf231a2803440aCC 100000
    ```

    (Pay attention to providing the correct `--network` argument.)

# Known Issues / Troubleshooting

*   On macos, internal docker network loads on the docker host VM can cause slow
    DNS lookups for external connections. This also affects pulling of images.

    If docker image download are slow or even time out, it can help to first
    build and pull all images before starting any projects:

    Pull images:

    ```sh
    docker compose -f chain-0.yaml pull
    docker compose -f chain-1.yaml pull
    ```

    And then start the project without pulling:

    ```sh
    docker compose -f chain-0.yaml up -d --pull=missing
    docker compose -f chain-1.yaml up -d --pull=missing
    ```

*   Currently, some internal components of Blockscout communicate via the
    host network, which makes the the configuration more complicated and also
    makes the system less efficient. This is something we should fix eventually.

*   Indexing often fails to keep up with block production. One reason might be
    the high blockrate in the Chainweb devnet. It is also possible that there is
    an issue with the configuration of the index. It is something we would have
    to take a closer look at.

*   The configuration of the different components is far from perfect. There are
    still lots of low-hanging fruits to improve the integration of Chainweb with
    Blockscout.
