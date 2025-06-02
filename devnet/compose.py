#!/usr/bin/env python3

# ########################## Instructions #####################################
# Create a GITHUB_TOKEN env var with token with packages:read permission
# to access the private docker images. Then run:
## echo "$GITHUB_TOKEN" |docker login ghcr.io -u <GITHUB_USERNAME> --password-stdin
# cd to this directory, then (use uv: https://docs.astral.sh/uv/getting-started/installation/)
## uv run python ./compose.py > docker-compose.yaml && docker compose up -d
# #############################################################################

import argparse
import os
import json
import yaml
from secp256k1 import PrivateKey
from typing import TypedDict, Any

DEFAULT_CHAINWEB_NODE_IMAGE = "ghcr.io/kadena-io/chainweb-node:sha-5ed0db4"
DEFAULT_EVM_IMAGE = "ghcr.io/kadena-io/kadena-reth:sha-65cc961"

# #############################################################################
# BOILERPLATE
# #############################################################################

# TODO: at this point it might actually be beter to define actual Python classes
# instead of just using dictionaries. In the end it is all about readability and
# convenience.


class Service(TypedDict, total=False):
    container_name: str
    hostname: str
    labels: dict[str, Any]
    image: str
    restart: str
    stop_grace_period: str
    stop_signal: str
    ulimits: dict[str, dict[str, str | int]]
    expose: list[str]
    ports: list[dict | str]
    secrets: list[dict | str]
    configs: list[dict | str]
    volumes: list[dict | str]
    networks: dict[str, None]
    depends_on: dict[str, dict]
    working_dir: str
    entrypoint: list[str]
    deploy: dict[str, dict[str, str | int]]
    healthcheck: dict
    build: dict[str, str]
    environment: list[str] | dict[str, str]
    platform: str
    profiles: list[str]
    command: list[str]


class Spec(TypedDict):
    name: str
    secrets: dict[str, dict]
    configs: dict[str, dict]
    networks: dict[str, None]
    volumes: dict[str, None]
    services: dict[str, Service]


# Template for a service component. These are not merged by default. The
# default values in the template makes updateing more convient by providing
# default values and also a bit less error prone by fixing the some of the types.
#
service: Service = {
    "ulimits": {},
    "expose": [],
    "ports": [],
    "secrets": [],
    "configs": [],
    "volumes": [],
    "networks": {},
    "depends_on": {},
    "entrypoint": [],
    "profiles": [],
    "command": [],
}

# Template for a service specification. The toplevel elements are merged into a
# single docker compose projects.
#
spec: Spec = {
    "name": "spec",
    "secrets": {},
    "configs": {},
    "networks": {},
    "volumes": {},
    "services": {},
}


# Shallow merge of docker compose specifications with increasing precedence.
#
def join_specs(specs: list[Spec]) -> Spec:
    def join(left: Spec, right: Spec) -> Spec:
        return {
            "name": left["name"] if left["name"] else right["name"],
            "secrets": left["secrets"] | right["secrets"],
            "configs": left["configs"] | right["configs"],
            "networks": left["networks"] | right["networks"],
            "volumes": left["volumes"] | right["volumes"],
            "services": left["services"] | right["services"],
        }

    result: Spec = Spec(spec)
    for x in specs:
        result = join(result, x)
    return result


# #############################################################################
# CONFIGURATION FILES
# #############################################################################

def config_dir(project_name: str, node_name: str) -> str:
    return f"./config/{project_name}/{node_name}"

# #############################################################################
# Payload Provider Configuration for Consensus
#
# TODO: this enables payload production for all enabled payload providers.
# We could safe some resources by only enabling mining when mining coordination
# is also enabled in consensus.

jwtsecret = "10b45e8907ab12dd750f688733e73cf433afadfd2f270e5b75a6b8fff22dd352"
evmMinerAddress = "0xd42d71cdc2A0a78fE7fBE7236c19925f62C442bA"


defaultPactMiner = {
    "account": "NoMiner",
    "public-keys": [],
    "predicate": "<",
}


def jwtsecret_config(project_name, node_name: str, update: bool = False) -> None:
    """
    Creates JWT secret file for the node.
    An existing file is not overwritten unless `update` is set to True.
    """
    os.makedirs(config_dir(project_name, node_name), exist_ok=True)
    file = f"{config_dir(project_name,node_name)}/jwtsecret"
    if update or not os.path.exists(file):
        with open(file, "w") as f:
            f.write(jwtsecret)


def payload_provider_config(
    project_name: str,
    mining_node: bool,
    node_name: str,
    evm_chains: list[int],
    pact_chains: list[int]
) -> None:
    config = {
        "chainweb": {
            "payloadProviders": {
                f"chain-{cid}":
                    {
                    "type": "evm",
                    "engineUri": f"http://{node_name}-evm-{cid}:8551/",
                    "engineJwtSecret": f"{jwtsecret}",
                    }
                    |
                    ({
                    "minerAddress": f"{evmMinerAddress}",
                    }
                    if mining_node else {})
                for cid in evm_chains
            }
            | {
                f"chain-{cid}":
                    {
                    "type": "pact",
                    }
                    |
                    ({
                    "miner": defaultPactMiner,
                    }
                    if mining_node else {})
                for cid in pact_chains
            }
            | {
                "default": {
                    "redeemAccount": "0xd42d71cdc2A0a78fE7fBE7236c19925f62C442bA",
                    "redeemChain": 0,
                },
            }
        },
    }
    os.makedirs(config_dir(project_name, node_name), exist_ok=True)
    file = f"{config_dir(project_name, node_name)}/payload-providers.yaml"
    with open(file, "w") as f:
        yaml.dump(config, f, default_flow_style=False)


# #############################################################################
# Bootstrap Node IDs


# This is needed only if more than a single node is deployed.
#
# https://github.com/ethereum/devp2p/blob/master/discv4.md:
# Every node has a cryptographic identity, a key on the secp256k1 elliptic
# curve. The public key of the node serves as its identifier or 'node ID'.
#
def evm_bootnodes(project_name, node_name, evm_cids, update: bool = False) -> None:
    for cid in evm_cids:
        dir = config_dir(project_name, node_name)
        os.makedirs(dir, exist_ok=True)

        secret_file = f"{dir}/evm-{cid}-p2p-secret"
        pk_file = f"{dir}/evm-{cid}-p2p-public"
        enode_file = f"{dir}/evm-{cid}-enode"

        # generate a secp256k1 keypair
        sk = PrivateKey()
        # drop the leading 0x04 byte from the public key
        pk = sk.pubkey.serialize(compressed=False)[1:]

        exists = (
            os.path.exists(secret_file)
            and os.path.exists(pk_file)
            and os.path.exists(enode_file)
        )

        if update or not exists:
            # Reth requires that the private key is given in a file with no new line
            with open(secret_file, "w") as f:
                print(sk.serialize(), file=f, end="")
            with open(pk_file, "w") as f:
                print(pk.hex(), file=f)
            with open(enode_file, "w") as f:
                print(f"enode://{pk.hex()}@{node_name}-evm-{cid}:{30303 + cid}", file=f)


# ############################################################################# #
# Nginx Reverse Proxy


def nginx_index_html(project_name, node_name, evm_cids, port=1848):
    pact_chains = [i for i in range(0, 20)]
    dir = config_dir(project_name, node_name)
    os.makedirs(dir, exist_ok=True)

    with open(f"{dir}/index.html", "w") as f:
        f.write(
            f"""
<script src="https://cdn.jsdelivr.net/npm/@webcomponents/webcomponentsjs@2/webcomponents-loader.min.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/gh/zerodevx/zero-md@1/src/zero-md.min.js"></script>
<zero-md>
    <script type="text/markdown">
    # Nginx proxy

    This proxy provides a reverse proxy for the Kadena EVM development network.
    It allows you to access the EVM development network via a single endpoint.

    ## Usage
    You can access the EVM development network via the following URL:
    ```
    <current-host>/chainweb/0.0/evm-development/
    <current-host>/chainweb/0.0/evm-development/chain/{{cid}}/evm/rpc
    <current-host>/chainweb/0.0/evm-development/chain/{{cid}}/pact/api/v1
    ```

    ## Links
    - [/chainweb/0.0/evm-development/cut](http://localhost:{port}/chainweb/0.0/evm-development/cut)
    - [/chainweb/0.0/evm-development/chain/0/pact/api/v1](http://localhost:{port}/chainweb/0.0/evm-development/chain/0/pact/api/v1)
    - [/chainweb/0.0/evm-development/chain/20/evm/rpc](http://localhost:{port}/chainweb/0.0/evm-development/chain/20/evm/rpc)

    ## Endpoints
    The following endpoints are available. They all start with prefix
    `http://localhost:{port}/chainweb/0.0/evm-development/`:

    - [Consensus API /cut](http://localhost:{port}/chainweb/0.0/evm-development/cut)

    </script>
</zero-md>

<details>
<summary>Pact API</summary>
    <zero-md>
    <script type="text/markdown">
{''.join(
    f'- [Pact API <prefix>/chain/{cid}/pact/api/v1](http://localhost:{port}/chainweb/0.0/evm-development/chain/{cid}/pact/api/v1)\n'
    for cid in pact_chains
)}
        </script>
    </zero-md>
</details>
<details>
    <summary>EVM RPC</summary>
    <zero-md>
        <script type="text/markdown">
    {''.join(
        f'- [EVM RPC <prefix>/chain/{cid}/evm/rpc](http://localhost:{port}/chainweb/0.0/evm-development/chain/{cid}/evm/rpc)\n'
        for cid in evm_cids
    )}
        </script>
    </zero-md>
</details>

<zero-md>
    <script type="text/markdown">
## Hardhat config
```
{
    json.dumps({
        "chainweb": {
            "devnet": {
                "chains": len(evm_cids),
                "type": 'external',
                "chainwebChainIdOffset": 20,
                "chainIdOffset": 1789,
                "accounts": [
                    "0xe711c50150f500fdebec57e5c299518c2f7b36271c138c55759e5b4515dc7161",
                    "0xb332ddc4e0801582e154d10cad8b672665656cbf0097f2b47483c0cfe3261299",
                    "0x28536b3ec112d99faeceb6cfaccd4b2b920fcb7cd6689ed3b2f842142ce196cb",
                    "0x9ff14f986d2e7c49c6b1f598aa55b8d79adfebb3e1c094abad8bd515ddcb1d6a",
                    "0x14fcd41cf1adc5ac71e1da6e8463a293520be53a1a0059d9730a01fc5aee5cb2"
                ],
                "externalHostUrl": f"http://localhost:{port}/chainweb/0.0/evm-development/",
            },
        },
    }, indent=2)
}
```
</script>
</zero-md>
    """
        )


# All endpoints for Kadena
# - consensus APIs (the same as api.chainweb.com/openapi)
#   - https://hostname/chainweb/0.0/{networkName}/...  -> bootnode-consensus:1848
# - pact service api (for each pact chain)
#   - https://hostname/chainweb/0.0/{networkName}/chain/{chainId}/pact/api/v1/... -> bootnode-consensus:1848
# - evm RPC endpoint  (for each evm chain)
#   - https://hostname/chainweb/0.0/{networkName}/chain/{chainId}/evm  = rpc endpoint


def nginx_proxy_config(project_name, node_name, evm_cids):
    dir = config_dir(project_name, node_name)
    os.makedirs(dir, exist_ok=True)

    with open(f"{dir}/nginx.conf", "w") as f:
        f.write(
            f"""
worker_processes 1;
events {{
    worker_connections 1024;
}}
http {{
    include       mime.types;
    default_type  application/octet-stream;

    sendfile        on;
    keepalive_timeout  65;

    server {{
        listen 1848;
        server_name {node_name}-frontend;

        location /info {{
            add_header Content-Type application/json;
            add_header Access-Control-Allow-Origin *;
            return 200 '{{"nodeVersion": "evm-development"}}';
        }}

        location / {{
            root /usr/share/nginx/html;
            add_header Access-Control-Allow-Origin *;
            index index.html;
        }}

        location /chainweb/0.0/evm-development/ {{
            proxy_pass http://{node_name}-consensus:1848;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            add_header Access-Control-Allow-Origin *;
        }}
        
        location = /mining-trigger {{
            internal;
            proxy_pass http://{node_name}-mining-trigger:11848/trigger;
            proxy_set_header X-Original-URI $request_uri;
        }}
    {''.join(
        f"""
        location /chainweb/0.0/evm-development/chain/{cid}/evm/rpc {{
            mirror /mining-trigger;
            add_header Access-Control-Allow-Origin *;
            proxy_pass http://{node_name}-evm-{cid}:8545/;
        }}
        """
        for cid in evm_cids
    )}
    }}
}}
"""
        )


# #############################################################################
# Simulate port forwarding
#
# We want to simulate port forwarding via a NAT device from a public IP address.
# The idea is to run a custorm port-forwarder service in each node network, that
# does the network translation.
#
# We could use nginx for this. But we need both TCP and UDP. Alternatively we
# could just use the domain-names + ports directly.


# #############################################################################
# SERVICES COMPONENTS
# #############################################################################


# ############################################################################# #
# Nginx Reverse Proxy


# All endpoints for Kadena
# - consensus APIs (the same as api.chainweb.com/openapi)
#   - https://api.chainweb.com/chainweb/0.0/mainnet01/...  -> bootnode-consensus:1848
# - pact service api (for each pact chain)
#   - https://api.chainweb.com/chainweb/{apiVersion}/mainnet01/chain/{chainId}/pact/api/v1/... -> bootnode-consensus:1848
# - evm RPC endpoint  (for each evm chain)
#   - https://api.chainweb.com/chainweb/{apiVersion}/mainnet01/chain/{chainId}/evm/api/v1/... -> bootnode-evm-{cid}:8545


def nginx_reverse_proxy(node_name: str, evm_cids: list[int], exposed: bool = False) -> Service:
    result: Service = {
        "container_name": f"{node_name}-frontend",
        "hostname": f"{node_name}-frontend",
        "image": "${NGINX_IMAGE:-nginx:latest}",
        "platform": "linux/amd64",
        "restart": "unless-stopped",
        "networks": {
            f"{node_name}-internal": None,
            f"{node_name}-frontend": None,
        },
        "volumes": [f"{node_name}_logs:/var/log/nginx"],
        "configs": [
            {
                "source": f"{node_name}-nginx-config",
                "target": "/etc/nginx/nginx.conf",
                "mode": "0440",
            },
            {
                "source": f"{node_name}-nginx-html",
                "target": "/usr/share/nginx/html/index.html",
                "mode": "0440",
            },
        ],
        "expose": ["1848"],
        "ports": [],
        "depends_on": {
            f"{node_name}-consensus": {"condition": "service_healthy"},
            **{
                f"{node_name}-evm-{cid}": {"condition": "service_started"}
                for cid in evm_cids
            },
        },
    }

    if exposed:
        result["ports"] += ["1848:1848"]

    return result


# ############################################################################# #
# Chainweb Consensus

bootnode_name = "bootnode"
bootnode_consensus_host = f"{bootnode_name}-consensus"


def chainweb_consensus_service(
    node_name: str,
    evm_cids: list[int],
    *,
    is_bootnode=False,
    mining=False,
    exposed=False,
    has_frontend=False,
) -> Service:
    result: Service = {
        "container_name": f"{node_name}-consensus",
        "hostname": f"{node_name}-consensus",
        "labels": {
            "com.docker.lb.ip_hash": True,
            "com.chainweb.devnet.description": "EVM Devnet Chainweb Node",
            "com.chainweb.devnet.chainweb-node": "",
        },
        "image": f"${{CHAINWEB_NODE_IMAGE:-{DEFAULT_CHAINWEB_NODE_IMAGE}}}",
        "platform": "linux/amd64",
        "restart": "unless-stopped",
        "stop_grace_period": "20s",
        "stop_signal": "SIGINT",
        "ulimits": {
            "nofile": {
                "soft": 65535,
                "hard": 65535,
            },
        },
        "expose": [
            "1789",
            "1848",
        ],
        "ports": [],
        "secrets": [],
        "volumes": [f"{node_name}-consensus_data:/chainweb/db:rw"],
        "configs": [
            {
                "source": f"{node_name}-consensus-config",
                "target": "/chainweb/config/consensus.yaml",
                "mode": "0440",
            },
            {
                "source": f"{node_name}-payload-providers",
                "target": "/chainweb/config/payload-providers.yaml",
                "mode": "0440",
            },
        ],
        "depends_on": {
            f"{node_name}-evm-{i}": {"condition": "service_started"} for i in evm_cids
        },
        "networks": {
            f"{node_name}-internal": None,
            "p2p": None,
        },
        "entrypoint": [
            "/chainweb/chainweb-node",
            # Runtime Settings
            "+RTS",
            "-T",
            "-H400M",
            "-A64M",
            "-RTS",
            "--config-file=config/consensus.yaml",
            "--config-file=config/payload-providers.yaml",
            "--database-directory=/chainweb/db",
            "--disable-pow",
            f"--cluster-id={node_name}-consensus",
        ],
        "deploy": {
            "restart_policy": {
                "condition": "on-failure",
                "delay": "5s",
                "max_attempts": 3,
                "window": "120s",
            },
            "update_config": {
                "delay": "60s",
                "order": "stop-first",
            },
        },
        "healthcheck": {
            "test": [
                "CMD",
                "/bin/bash",
                "-c",
                'exec 3<>/dev/tcp/localhost/1848; printf "GET /health-check HTTP/1.1\\r\\nhost: http://localhost:1848\\r\\nConnection: close\\r\\n\\r\\n" >&3; grep -q "200 OK" <&3 || exit 1',
            ],
            "interval": "30s",
            "timeout": "30s",
            "retries": 5,
            "start_period": "2m",
        },
    }

    if exposed:
        if has_frontend:
            result["ports"] += ["11848:1848"]
        else:
            result["ports"] += ["1848:1848"]

    if is_bootnode:
        result["entrypoint"] += [
            # Bootnode Settings
            "--bootstrap-reachability=0",
            "--p2p-certificate-chain-file=/run/secrets/p2p.cert.pem",
            "--p2p-certificate-key-file=/run/secrets/p2p.key.pem",
            f"--p2p-hostname={node_name}-consensus",
        ]
        result["secrets"] += [
            {
                "source": f"{node_name}-consensus-p2p-key",
                "target": "p2p.key.pem",
            },
            {
                "source": f"{node_name}-consensus-p2p-certificate",
                "target": "p2p.cert.pem",
            },
        ]
    else:
        result["entrypoint"] += [
            "--p2p-hostname=0.0.0.0",
            "--bootstrap-reachability=0.6",
            f"--known-peer-info=YNo7pXthYQ9RQKv1bbpQf2R5LcLYA3ppx2BL2Hf8fIM@{bootnode_consensus_host}:1789",
        ]
        result["depends_on"] |= {
            f"{bootnode_consensus_host}": {"condition": "service_healthy"},
        }

    if mining:
        result["entrypoint"] += ["--enable-mining-coordination"]

    return result


# ############################################################################# #
# EVM Services


def evm_chain(
    node_name: str,
    cid: int,
    *,
    boot_enodes: list[str] = [],
    is_bootnode=False,
    exposed=False
) -> Service:
    apis = "admin,debug,eth,net,trace,txpool,web3,rpc,reth,ots"  # ,flashbots,miner,mev"
    result: Service = {
        "container_name": f"{node_name}-evm-{cid}",
        "hostname": f"{node_name}-evm-{cid}",
        "restart": "unless-stopped",
        "image": f"${{EVM_IMAGE:-{DEFAULT_EVM_IMAGE}}}",
        "secrets": [
            {
                "source": f"{node_name}-jwtsecret",
                "target": "jwtsecret",
            }
        ],
        "configs": [
            {
                "source": f"{node_name}-chain-spec-{cid}",
                "target": "/config/chain-spec.json",
                "mode": "0440",
            }
        ],
        "volumes": [
            f"{node_name}-evm-{cid}_data:/root/.local/share/reth/{1789 + cid - 20}/",
            f"{node_name}_logs:/root/logs/",
        ],
        "networks": {
            f"{node_name}-internal": None,
            "p2p": None,
        },
        "expose": [
            "8545",
            "8546",
            "8551",
            "9001",
            f"{30303 + cid}/tcp",
            f"{30303 + cid}/udp",
        ],
        "ulimits": {"nofile": {"soft": 65535, "hard": 65535}},
        "entrypoint": [
            "/app/kadena-reth",
            "node",
            "--metrics=0.0.0.0:9001",
            "--log.file.directory=/root/logs",
            # p2p
            "--addr=0.0.0.0",
            f"--port={30303 + cid}",
            # authrpc
            "--authrpc.jwtsecret=/run/secrets/jwtsecret",
            "--authrpc.addr=0.0.0.0",
            "--authrpc.port=8551",
            # http
            "--http",
            "--http.addr=0.0.0.0",
            "--http.port=8545",
            f"--http.api={apis}",
            # websocket
            "--ws",
            "--ws.addr=0.0.0.0",
            "--ws.port=8546",
            f"--ws.api={apis}",
            # discovery
            "--disable-nat",
            "--nat=none",
            "--disable-dns-discovery",
            f"--discovery.port={30303 + cid}",
            # chainweb
            "--chain=/config/chain-spec.json",
            "--engine.experimental",
            "--engine.persistence-threshold=0",
            "--engine.memory-block-buffer-target=0"
        ],
        "environment": [f"CHAINWEB_CHAIN_ID={cid}"],
        "ports": [],
    }

    # exposed node
    if exposed:
        result["ports"] += [
            f"{cid * 1000 + 8545}:{8545}",
            f"{cid * 1000 + 8546}:{8546}",
        ]

    # bootnode
    if is_bootnode:
        result["entrypoint"] += [
            "--p2p-secret-key=/run/secrets/p2p-secret",
        ]
        result["secrets"] += [
            {
                "source": f"{node_name}-evm-{cid}-p2p-secret",
                "target": "p2p-secret",
            }
        ]

    if boot_enodes is not None and len(boot_enodes) > 0:
        result["entrypoint"] += [f"--bootnodes={",".join(boot_enodes)}"]

    return result


# ############################################################################# #
# Chainweb Miner


def chainweb_mining_client(
    node_name: str, *, mode="simulation", exposed=False
) -> Service:
    result: Service = {
        "container_name": f"{node_name}-mining-client",
        "hostname": f"{node_name}-mining-client",
        "image": "${MINING_CLIENT_IMAGE:-ghcr.io/kadena-io/chainweb-mining-client:latest}",
        "platform": "linux/amd64",
        "restart": "unless-stopped",
        "depends_on": {f"{node_name}-consensus": {"condition": "service_healthy"}},
        "networks": {
            f"{node_name}-internal": None,
        },
        "entrypoint": [
            "/chainweb-mining-client/chainweb-mining-client",
            f"--node={node_name}-consensus:1848",
            "--thread-count=1",
            "--no-tls",
            f"--worker={mode}",
            # only used when worker is set to "simulation"
            "--hash-rate=1000000",
            # only used when worker is set to "constant-delay"
            "--constant-delay-block-time=${BLOCK_RATE:-2}",
            # only used when worker is set to "on-demand"
            "--on-demand-port=1917",
        ],
        "ports": [],
    }

    if exposed:
        result["ports"] += ["1917:1917"]

    return result


# ############################################################################# #
# Mining Trigger


def chainweb_mining_trigger(node_name: str) -> Service:
    result: Service = {
        "container_name": f"{node_name}-mining-trigger",
        "hostname": f"{node_name}-mining-trigger",
        "image": "oven/bun:latest",
        "restart": "unless-stopped",
        "depends_on": {f"{node_name}-consensus": {"condition": "service_healthy"}},
        "networks": {
            f"{node_name}-internal": None,
        },
        "volumes": ["./mining-trigger:/app"],
        "working_dir": "/app",
        "entrypoint": [
            "bun",
            "--watch",
            "index.ts",
        ],
        "expose": ["11848"],
        "environment": {
            "MINER_HOSTNAME": f"{node_name}-mining-client",
            "MINER_PORT": "1917",
            "CONSENSUS_ENDPOINT": f"http://{node_name}-consensus:1848/chainweb/0.0/evm-development",
            "CHAINS": "20",
        },
    }

    return result


# ############################################################################# #
# Allocations


def allocations(node_name: str, evm_cid: int) -> Service:
    return {
        "container_name": f"{node_name}-allocations",
        "image": "${ALLOCATIONS_IMAGE:-ghcr.io/kadena-io/evm-devnet-allocations:latest}",
        "build": {"context": "../allocations", "dockerfile": "Dockerfile"},
        "depends_on": {f"{node_name}-evm-{evm_cid}": {"condition": "service_started"}},
        "environment": [f"RPC_URL=http://{node_name}-evm-{evm_cid}:8545"],
        "networks": {
            f"{node_name}-internal": None,
        },
    }


# ############################################################################# #
# Debugging Utils


def curl(nodes: list[str]) -> Service:
    return {
        "labels": {
            "com.chainweb.devnet.description": "Curl Into Network",
            "com.chainweb.devnet.debug": "",
        },
        "image": "curlimages/curl:latest",
        "profiles": ["debug"],
        "networks": {f"{n}-internal": None for n in nodes}
        | {
            "p2p": None,
        },
        "environment": {
            "CL_NODES": "${CL_NODES:-"
            + ",".join([n + "-consensus" for n in nodes])
            + "}"
        },
    }


# example usages
#
# Get info at block height:
# > docker compose run --rm -e 'HEIGHT=92094' debug | jq '.headers."1"' | jqp
#
# Scan block from block height for receipts:
# > docker compose run --rm debug -c "source ./functions.sh; list_receipts_from_height 1 90000"
#
def debug(nodes: list[str]) -> Service:
    return {
        "build": {"context": "./debug", "dockerfile": "Dockerfile"},
        "profiles": ["debug"],
        "entrypoint": ["/bin/bash", "-c"],
        "environment": {
            "HEIGHT": "${HEIGHT:-latest}",
            "CL_NODES": "${CL_NODES:-"
            + ",".join([n + "-consensus" for n in nodes])
            + "}",
        },
        "command": [
            """
            source ./functions.sh
            info $$HEIGHT
            """
        ],
        "networks": {f"{n}-internal": None for n in nodes}
        | {
            "p2p": None,
        },
    }


# ############################################################################# #
# SERVICE SPECIFICATIONS
# ############################################################################# #


# ############################################################################# #
# Chainweb Node Service


# A chainweb node consists of the the following service components:
#
# Mandatory:
# - <NAME>-consensus
# - <NAME>-evm-<cid>, for any number of evm chains
# - <NAME>-mining-client, if the node is a mining node
# - <NAME>-frontend, service API reverse proxy (TODO)
#
# It uses the the following networks:
# - <NAME>-internal, internal network for the node
# - p2p, the global p2p network
# - the host network if the the node is "exposed"
#
# Conditions:
#
# Mining nodes must have *all* chains enabled. Bootnodes must have *all* EVM
# chains enabled. These condition are currently not checked.
#
def chainweb_node(
    project_name: str,
    node_name: str,
    evm_cids: list[int],
    pact_cids: list[int],
    is_bootnode: bool = False,
    mining_mode: str | None = None,
    has_frontend: bool = False,
    exposed: bool = False,
) -> Spec:
    jwtsecret_config(project_name, node_name)
    payload_provider_config(project_name, mining_mode is not None, node_name, evm_cids, pact_cids)
    cdir = config_dir(project_name, node_name)


    # EVM bootnodes for each EVM chain:
    def boot_enodes(cid: int) -> list[str]:
        bdir = config_dir(project_name, "bootnode")
        if not os.path.isdir(bdir):
            raise RuntimeError("Bootnode config directory not found.")
        with open(f"{bdir}/evm-{cid}-enode", "r") as f:
            return [f.read().strip()]

    result: Spec = {
        "name": f"{node_name}",
        "secrets": {
            f"{node_name}-jwtsecret": {"file": f"{cdir}/jwtsecret"}
        },
        "configs": {
            f"{node_name}-consensus-config": {"file": "./config/consensus-config.yaml"},
            f"{node_name}-payload-providers": { "file": f"{cdir}/payload-providers.yaml"},
        }
        | {
            f"{node_name}-chain-spec-{cid}": {
                "file": f"chain-specs/chain-spec-{cid}.json"
            }
            for cid in evm_cids
        },
        "networks": {
            f"{node_name}-internal": None,
        },
        "volumes": {
            f"{node_name}-consensus_data": None,
            f"{node_name}_logs": None,
        }
        | {f"{node_name}-evm-{cid}_data": None for cid in evm_cids},
        "services": {
            f"{node_name}-consensus": chainweb_consensus_service(
                node_name,
                evm_cids,
                is_bootnode=is_bootnode,
                mining=False if mining_mode is None else True,
                exposed=exposed,
                has_frontend=has_frontend,
            ),
        }
        | {
            f"{node_name}-evm-{cid}": evm_chain(
                node_name,
                cid,
                boot_enodes = boot_enodes(cid) if not is_bootnode else [],
                is_bootnode=is_bootnode,
                exposed=exposed,
            )
            for cid in evm_cids
        },
    }

    if has_frontend:

        # Create nginx reverse proxy configuration for exposed nodes
        nginx_proxy_config(project_name, node_name, evm_cids)
        nginx_index_html(project_name, node_name, evm_cids)
        cdir = config_dir(project_name, node_name)

        result["configs"] |= {
            f"{node_name}-nginx-config": {"file": f"{cdir}/nginx.conf"},
            f"{node_name}-nginx-html": {"file": f"{cdir}/index.html"},
        }
        result["services"] |= {
            f"{node_name}-frontend": nginx_reverse_proxy(
                node_name,
                evm_cids,
                exposed=exposed,
            ),
        }
        result["networks"][f"{node_name}-frontend"] = None

    if is_bootnode:
        result["secrets"] |= {
            f"{node_name}-evm-{cid}-p2p-secret": {
                "file": f"{cdir}/evm-{cid}-p2p-secret"
            }
            for cid in evm_cids
        } | {
            f"{node_name}-consensus-p2p-key": {
                "file": f"./config/{node_name}-consensus-p2p.key.pem"
            },
            f"{node_name}-consensus-p2p-certificate": {
                "file": f"./config/{node_name}-consensus-p2p.cert.pem"
            },
        }

    if mining_mode is not None:
        result["services"] |= {
            f"{node_name}-mining-client": chainweb_mining_client(
                node_name,
                exposed=exposed,
                mode=mining_mode,
            )
        }

    if mining_mode == "on-demand":
        result["services"] |= {
            f"{node_name}-mining-trigger": chainweb_mining_trigger(node_name)
        }

    return result


# ############################################################################# #
# Project


def other_services(nodes: list[str]) -> Spec:
    return {
        "name": "other-services",
        "services": {
            "allocations": allocations("bootnode", 20),
            "curl": curl(nodes),
            "debug": debug(nodes),
        },
        "networks": {},
        "volumes": {},
        "configs": {},
        "secrets": {},
    }


def debug_services(nodes: list[str]) -> Spec:
    return {
        "name": "other-services",
        "services": {
            "curl": curl(nodes),
            "debug": debug(nodes),
        },
        "networks": {},
        "volumes": {},
        "configs": {},
        "secrets": {},
    }


# ############################################################################# #
# COMPOSE PROJECT DEFINITIONS
# ############################################################################# #


# A default project setup. It runs a single frontend bootnode that has
# constant delay mining enabled and is exposed to the host network.
#
# It also includes the definition of curl container for easy to internal APIs
# for debugging.
#
def default_project(update_secrets: bool = False) -> Spec:
    # Create boostrap information
    evm_cids = list(range(20, 25))
    pact_cids = list(range(0, 20))

    # Create bootstrap node IDs
    evm_bootnodes("default", "bootnode", evm_cids, update=update_secrets)

    top: Spec = spec
    top["name"] = "chainweb-evm"
    top["networks"] = {"p2p": None}

    return join_specs(
        [
            top,
            chainweb_node(
                "default",
                "bootnode",
                evm_cids,
                pact_cids,
                is_bootnode=True,
                mining_mode="on-demand",
                exposed=True,
                has_frontend=True,
            ),
            other_services(['bootnode']),
        ]
    )

# A minimal project setup. It runs a single exposed bootnode that has simulation
# mining enabled.
#
# It also includes the definition of curl container for easy to internal APIs
# for debugging.
#
def minimal_project(update_secrets: bool = False) -> Spec:
    # Create boostrap information
    evm_cids = list(range(20, 25))
    pact_cids = list(range(0, 20))

    # Create bootstrap node IDs
    evm_bootnodes("minimal", "bootnode", evm_cids, update=update_secrets)

    top: Spec = spec
    top["name"] = "chainweb-evm"
    top["networks"] = {"p2p": None}
    top["services"] = {
        "curl": curl(["bootnode"]),
    }

    return join_specs(
        [
            top,
            chainweb_node(
                "minimal",
                "bootnode",
                evm_cids,
                pact_cids,
                is_bootnode=True,
                mining_mode="simulation",
                exposed=True,
                has_frontend=False,
            ),
        ]
    )


# A project for testing and debugging chainweb-node itself. It runs several
# nodes in different configurations.
#
def kadena_dev_project(update_secrets: bool = False) -> Spec:
    nodes = ["bootnode", "appdev", "miner-1", "miner-2"]

    # Create boostrap information
    evm_cids = list(range(20, 25))
    pact_cids = list(range(0, 20))

    # Create bootstrap node IDs
    evm_bootnodes("kadena-dev", "bootnode", evm_cids, update=update_secrets)

    top: Spec = spec
    top["name"] = "chainweb-evm"
    top["networks"] = {"p2p": None}

    return join_specs(
        [
            top,
            chainweb_node(
                "kadena-dev",
                "bootnode",
                evm_cids,
                pact_cids,
                is_bootnode=True,
                mining_mode=None,
                exposed=False,
                has_frontend=False,
            ),
            chainweb_node(
                "kadena-dev",
                "miner-1",
                evm_cids,
                pact_cids,
                is_bootnode=False,
                mining_mode="simulation",
                exposed=False,
                has_frontend=False,
            ),
            chainweb_node(
                "kadena-dev",
                "miner-2",
                evm_cids,
                pact_cids,
                is_bootnode=False,
                mining_mode="simulation",
                exposed=False,
                has_frontend=False,
            ),
            chainweb_node(
                "kadena-dev",
                "appdev",
                [20, 24],
                [1, 5, 19],
                is_bootnode=False,
                mining_mode=None,
                exposed=True,
                has_frontend=True,
            ),
            other_services(nodes),
        ]
    )


def kadena_dev_singleton_evm_project(update_secrets: bool = False) -> Spec:
    project_name = "kadena-dev-singleton-evm"
    nodes = ["bootnode", "miner-1", "miner-2"]

    # Create boostrap information
    evm_cids = list(range(1))
    pact_cids = []

    # Create bootstrap node IDs
    evm_bootnodes(project_name, "bootnode", evm_cids, update=update_secrets)

    top: Spec = spec
    top["name"] = "chainweb-evm"
    top["networks"] = {"p2p": None}

    specs = join_specs(
        [
            top,
            chainweb_node(
                project_name,
                "bootnode",
                evm_cids,
                pact_cids,
                is_bootnode=True,
                mining_mode=None,
                exposed=False,
                has_frontend=False,
            ),
            chainweb_node(
                project_name,
                "miner-1",
                evm_cids,
                pact_cids,
                is_bootnode=False,
                mining_mode="simulation",
                exposed=False,
                has_frontend=False,
            ),
            chainweb_node(
                project_name,
                "miner-2",
                evm_cids,
                pact_cids,
                is_bootnode=False,
                mining_mode="simulation",
                exposed=False,
                has_frontend=False,
            ),
            debug_services(nodes),
        ]
    )

    for n in nodes:
        specs["services"][f"{n}-consensus"]["entrypoint"] += [
            "--chainweb-version=evm-development-singleton",
        ]

    # FIXME: the chainspec file contains the wrong chainweb chain ID in the
    # chainweb-chain-id system contract.
    return specs


# A project setup for DApp development. It runs a single full bootstrap nodes
# that allows mines.
#
# * The node that backs the service API includes only the chains that are
#   provided on the command line.
# * Blocks are produced at a fixed rate of 2 seconds per chain.
# * There is a single bootstrap node that is also a miner.
#
def app_dev_project(exposed_evm_chains, exposed_pact_chains, update_secrets) -> Spec:
    nodes = ["bootnode", "appdev"]

    # Create boostrap information
    evm_cids = list(range(20, 25))
    pact_cids = list(range(0, 20))

    # Create bootstrap node IDs
    evm_bootnodes("add-dev", "bootnode", evm_cids, update=update_secrets)

    top: Spec = spec
    top["name"] = "chainweb-evm"
    top["networks"] = {"p2p": None}

    return join_specs(
        [
            top,
            chainweb_node(
                "app-dev",
                "bootnode",
                evm_cids,
                pact_cids,
                is_bootnode=True,
                mining_mode="constant-delay",
                exposed=False,
                has_frontend=False,
            ),
            chainweb_node(
                "app-dev",
                "appdev",
                exposed_evm_chains,
                exposed_pact_chains,
                is_bootnode=False,
                mining_mode=None,
                exposed=True,
                has_frontend=True,
            ),
            other_services(nodes),
        ]
    )


# A project setup "legacy" pact development. It exposes the service API for all
# pact chains.
#
# FIXME: this is work in progress
#
def pact_project(update_secrets: bool = False) -> Spec:
    nodes = ["bootnode", "appdev"]

    evm_cids = list(range(20, 25))
    pact_cids = list(range(0, 20))

    # Create bootstrap node IDs
    evm_bootnodes("pact", "bootnode", evm_cids, update=update_secrets)

    top: Spec = spec
    top["name"] = "chainweb-evm"
    top["networks"] = {"p2p": None}

    return join_specs(
        [
            top,
            chainweb_node(
                "pact",
                "bootnode",
                evm_cids,
                pact_cids,
                is_bootnode=True,
                mining_mode="constant-delay",
                exposed=False,
                has_frontend=False,
            ),
            chainweb_node(
                "pact",
                "appdev",
                [],
                exposed_pact_chains,
                is_bootnode=False,
                mining_mode=None,
                exposed=True,
                has_frontend=True,
            ),
            other_services(nodes),
        ]
    )


# A project setup for mining pools. It runs a single full node that has mining
# enabled.
#
# The minining client exposes the stratum server API on port 1917.
#
# FIXME: this is work in progress
#
def mining_pool_project(update_secrets: bool = False) -> Spec:
    nodes = ["bootnode"]

    # Create boostrap information
    evm_cids = list(range(20, 25))
    pact_cids = list(range(0, 20))

    # Create bootstrap node IDs
    evm_bootnodes("mining-pool", "bootnode", evm_cids, update=update_secrets)

    top: Spec = spec
    top["name"] = "chainweb-evm"
    top["networks"] = {"p2p": None}

    return join_specs(
        [
            top,
            chainweb_node(
                "mining-pool",
                "bootnode",
                evm_cids,
                pact_cids,
                is_bootnode=True,
                mining_mode="stratum",
                exposed=False,
                has_frontend=False,
            ),
            other_services(nodes),
        ]
    )


# #############################################################################
# main

parser = argparse.ArgumentParser()
parser.add_argument("--exposed-chains")
parser.add_argument("--project")
parser.add_argument("--update-secrets", action="store_true", help="Update existing secrets")
args = parser.parse_args()

# All available EVM chains
if args.exposed_chains is None:
    exposed_evm_chains = list(range(20, 25))
    exposed_pact_chains = list(range(0, 20))
else:
    exposed_cids = list(map(int, args.evm_chains.split(",")))
    exposed_evm_chains = [i for i in range(20, 25) if i in exposed_cids]
    exposed_pact_chains = [i for i in range(0, 20) if i in exposed_cids]

update_secrets = args.update_secrets

# print the docker-compose file
match args.project:
    case "minimal":
        print(yaml.dump(minimal_project(update_secrets=update_secrets), indent=4))
    case "kadena-dev":
        print(yaml.dump(kadena_dev_project(update_secrets=update_secrets), indent=4))
    case "kadena-dev-singleton-evm":
        print(yaml.dump(kadena_dev_singleton_evm_project(update_secrets=update_secrets), indent=4))
    case "appdev":
        print(
            yaml.dump(
                app_dev_project(
                    exposed_evm_chains,
                    exposed_pact_chains,
                    update_secrets=update_secrets
                ), indent=4
            )
        )
    case "pact":
        print(yaml.dump(pact_project(update_secrets=update_secrets), indent=4))
    case "mining-pool":
        print(yaml.dump(mining_pool_project(update_secrets=update_secrets), indent=4))
    case _:
        print(yaml.dump(default_project(update_secrets=update_secrets), indent=4))
