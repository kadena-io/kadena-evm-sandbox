#!/usr/bin/env python3

# pip install secp256k1
# pip install pyyaml

import argparse
import os
import json
import yaml
from secp256k1 import PrivateKey

# #############################################################################
# BOILERPLATE
# #############################################################################

Spec = dict[str, dict]

# Template for a service specification. The toplevel elements are merged into a
# single docker compose projects.
#
spec : Spec = {
    "name": None,
    "secrets": {},
    "configs": {},
    "networks": {},
    "volumes": {},
    "services": {},
}

# Shallow merge of docker compose specifications with increasing precedence.
#
def join_specs (specs : list[dict]) -> Spec:
    def join (left : Spec, right : Spec) -> Spec:
        return {
            "name": left["name"] if left["name"] else right["name"],
            "secrets": left["secrets"] | right["secrets"],
            "configs": left["configs"] | right["configs"],
            "networks": left["networks"] | right["networks"],
            "volumes": left["volumes"] | right["volumes"],
            "services": left["services"] | right["services"],
        }
    result = dict(spec)
    for x in specs:
        result = join(result, x)
    return result

# #############################################################################
# CONFIGURATION FILES
# #############################################################################

# #############################################################################
# Payload Provider Configuration for Consensus

jwtsecret = '10b45e8907ab12dd750f688733e73cf433afadfd2f270e5b75a6b8fff22dd352'
evmMinerAddress = '0xd42d71cdc2A0a78fE7fBE7236c19925f62C442bA'

def jwtsecret_config(node_name: str) -> None:
    os.makedirs(f"./config/{node_name}", exist_ok=True)
    with open(f"config/{node_name}/jwtsecret", "w") as f:
        f.write(jwtsecret)

def payload_provider_config(node_name: str, evm_chains: list[int]) -> None:
    config = {
        "chainweb": {
            "default": {
                "redeemAccount": '0xd42d71cdc2A0a78fE7fBE7236c19925f62C442bA',
                "redeemChain": 0,
            },
            "payloadProviders": {
                f"chain-{cid}": {
                    "type": "evm",
                    "engineUri": f"http://{node_name}-evm-{cid}:8551/",
                    "minerAddress": f"{evmMinerAddress}",
                    "engineJwtSecret": f"{jwtsecret}",
                } for cid in evm_chains
            },
        },
    }
    os.makedirs(f"./config/{node_name}", exist_ok=True)
    with open(f"config/{node_name}/payload-providers.yaml", "w") as f:
        yaml.dump(config, f, default_flow_style=False)
        

# #############################################################################
# Bootstrap Node IDs

# This is needed only if more than a single node is deployed.
#
# https://github.com/ethereum/devp2p/blob/master/discv4.md:
# Every node has a cryptographic identity, a key on the secp256k1 elliptic
# curve. The public key of the node serves as its identifier or 'node ID'.
#
def evm_bootnodes(node_name, evm_cids):
    for cid in evm_cids:
        # generate a secp256k1 keypair
        sk = PrivateKey()

        # drop the leading 0x04 byte from the public key
        pk = sk.pubkey.serialize(compressed=False)[1:]

        dir = f"config/{node_name}"
        os.makedirs(dir, exist_ok=True)

        # Reth requires that the private key is given in a file with no new line
        with open(f"{dir}/evm-{cid}-p2p-secret", "w") as f:
            print(sk.serialize(), file=f, end="")

        with open(f"{dir}/evm-{cid}-p2p-public", "w") as f:
            print(pk.hex(), file=f)

        with open(f"{dir}/evm-{cid}-enode", "w") as f:
            print(f"enode://{pk.hex()}@{node_name}-evm-{cid}:{30303+cid}", file=f)

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
# Chainweb Consensus

bootnode_name = "bootnode"
bootnode_consensus_host = f"{bootnode_name}-consensus"

def chainweb_consensus_service(
    node_name : str, 
    evm_cids : list[int],
    *,
    is_bootnode = False,
    mining = False, 
    exposed = False
): return {
    "container_name" : f"{node_name}-consensus",
    "hostname" : f"{node_name}-consensus",
    "labels": {
        "com.docker.lb.ip_hash": True,
        "com.chainweb.devnet.description": "EVM Devnet Chainweb Node",
        "com.chainweb.devnet.chainweb-node": ""
    },
    "image": "${CHAINWEB_NODE_IMAGE:-ghcr.io/kadena-io/evm-devnet-chainweb-node:latest}",
    # "platform": "linux/arm64",
    "restart": "unless-stopped",
    "stop_grace_period": "20s",
    "stop_signal": "SIGINT",
    "ulimits": {
        "nofile": {
            "soft": 65535,
            "hard": 65535
        }
    },
    "expose": [
        "1789",
        "1848"
    ],
    "volumes": [
        f"{node_name}-consensus_data:/chainweb/db:rw"
    ],
    "configs": [
        {
            "source": f"{node_name}-consensus-config",
            "target": "/chainweb/config/consensus.yaml",
            "mode": "0440"
        },
        {
            "source": f"{node_name}-payload-providers",
            "target": "/chainweb/config/payload-providers.yaml",
            "mode": "0440"
        }
    ],
    "secrets": [{
        "source": f"{node_name}-consensus-p2p-key",
        "target": "p2p.key.pem",
    },{
        "source": f"{node_name}-consensus-p2p-certificate",
        "target": "p2p.cert.pem",
    }] if is_bootnode else [],

    "depends_on": {
        f"{node_name}-evm-{i}": { "condition": "service_started" } 
        for i in evm_cids
    } | ({
        f"{bootnode_consensus_host}": { "condition": "service_healthy" }
    } if not is_bootnode else {}),
    "networks": {
        f"{node_name}-internal": None,
        "p2p": None,
    },
    "ports": [ "1848:1848" ] if exposed else [],
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

        # Mining
        "--enable-mining-coordination" if mining else "--disable-mining-coordination",
    ] + ([
        # Bootnode Settings
        "--bootstrap-reachability=0",
        "--p2p-certificate-chain-file=/run/secrets/p2p.cert.pem",
        "--p2p-certificate-key-file=/run/secrets/p2p.key.pem",
        f"--p2p-hostname={node_name}-consensus",
    ] if is_bootnode else [
        "--p2p-hostname=0.0.0.0",
        "--bootstrap-reachability=0.6",
        f"--known-peer-info=YNo7pXthYQ9RQKv1bbpQf2R5LcLYA3ppx2BL2Hf8fIM@{bootnode_consensus_host}:1789",
    ]),

    "deploy": {
        "restart_policy": {
            "condition": "on-failure",
            "delay": "5s",
            "max_attempts": 3,
            "window": "120s"
        },
        "update_config": {
            "delay": "60s",
            "order": "stop-first"
        }
    },
    "healthcheck": {
        "test": [
            "CMD",
            "/bin/bash",
            "-c",
            "exec 3<>/dev/tcp/localhost/1848; printf \"GET /health-check HTTP/1.1\\r\\nhost: http://localhost:1848\\r\\nConnection: close\\r\\n\\r\\n\" >&3; grep -q \"200 OK\" <&3 || exit 1"
        ],
        "interval": "30s",
        "timeout": "30s",
        "retries": 5,
        "start_period": "2m"
    }
}

# ############################################################################# #
# EVM Services

def evm_chain(
    node_name : str,
    cid : int,
    *,
    is_bootnode = False,
    exposed = False
) -> Spec:
    if not is_bootnode:
        if not os.path.isdir("./config/bootnode"):
            raise RuntimeError("Bootnode config directory not found.")
        with open(f"config/bootnode/bootnode-evm-{cid}-enode" , "r") as f:
            boot_enodes = f.read().strip()

    return {
        "container_name": f"{node_name}-evm-{cid}",
        "hostname": f"{node_name}-evm-{cid}",
        "restart": "unless-stopped",
        "image": "${EVM_IMAGE:-ghcr.io/kadena-io/evm-devnet-kadena-reth:latest}",
        "build": {
            "context": "../rust",
            "dockerfile": "Dockerfile",
        },
        "secrets": [{
                "source": f"{node_name}-jwtsecret",
                "target": "jwtsecret",
            }] + 
            ([{
                "source": f"{node_name}-evm-{cid}-p2p-secret",
                "target": "p2p-secret",
            }] if is_bootnode else []),
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
        "ulimits": {
            "nofile": {
                "soft": 65535,
                "hard": 65535
            }
        },
        "entrypoint": [
            "/app/kadena-reth",
            "node",
            "--metrics=0.0.0.0:9001",
            "--log.file.directory=/root/logs",
            # authrpc
            "--authrpc.jwtsecret=/run/secrets/jwtsecret",
            "--authrpc.addr=0.0.0.0",
            "--authrpc.port=8551",
            # http
            "--http",
            "--http.addr=0.0.0.0",
            "--http.port=8545",
            "--http.api=admin,debug,eth,net,trace,txpool,web3,rpc,reth,ots",
            # websocket
            "--ws",
            "--ws.addr=0.0.0.0",
            "--ws.port=8546",
            "--ws.api=admin,debug,eth,net,trace,txpool,web3,rpc,reth,ots",
            # discovery
            "--disable-nat",
            "--nat=none",
            "--disable-dns-discovery",
            f"--discovery.port={30303 + cid}",
            # chainweb
            "--chain=/config/chain-spec.json",

            # Only for bootstrap nodes
            "--p2p-secret-key=/run/secrets/p2p-secret",

            # for non-bootstrap nodes
            # Comma separated enode URLs for P2P discovery bootstrap.
            # "--bootnodes=TODO"
        ] + ([f"--bootnodes={boot_enodes}"] if not is_bootnode else []),
        "ports": [
            f"{cid*1000+8545}:{8545}",
            f"{cid*1000+8546}:{8546}"
        ] if exposed else [],
        "environment": [
            f"CHAINWEB_CHAIN_ID={cid}"
        ]
    }

# ############################################################################# #
# Chainweb Miner

def chainweb_mining_client (node_name : str, *, exposed = False): return {
    "container_name": f"{node_name}-mining-client",
    "hostname": f"{node_name}-mining-client",
    "image": "${MINING_CLIENT_IMAGE:-ghcr.io/kadena-io/chainweb-mining-client:latest}",
    "platform": "linux/amd64",
    "restart": "unless-stopped",
    "depends_on": {
        f"{node_name}-consensus": {
            "condition": "service_healthy"
        }
    },
    "networks": {
        f"{node_name}-internal": None,
    },
    "entrypoint": "/chainweb-mining-client/chainweb-mining-client",
    "command": [
        f"--node={node_name}-consensus:1848",
        "--worker=${MINING_WORKER:-constant-delay}",
        "--thread-count=2",
        "--no-tls",
        # only used when worker is set to "simulation"
        "--hash-rate=1000000",
        # only used when worker is set to "constant-delay"
        "--constant-delay-block-time=${BLOCK_RATE:-2}",
        # only used when worker is set to "on-demand"
        "--on-demand-port=1917",
    ],
    "ports": [ "1917:1917" ] if exposed else [],
}

# ############################################################################# #
# Allocations
  
def allocations(node_name : str, evm_cid: int): return {
    "container_name": f"{node_name}-allocations",
    "image": "${ALLOCATIONS_IMAGE:-ghcr.io/kadena-io/evm-devnet-allocations:latest}",
    "build": {
        "context": "../allocations",
        "dockerfile": "Dockerfile"
    },
    "depends_on": {
        f"{node_name}-evm-{evm_cid}": {
            "condition": "service_started"
        }
    },
    "environment": [
        f"RPC_URL=http://{node_name}-evm-{evm_cid}:8545"
    ],
    "networks": {
        f"{node_name}-internal": None,
    },
}

# ############################################################################# #
# Debugging Utils
  
def curl(nodes: list[str]): return {
    "labels": {
        "com.chainweb.devnet.description": "Curl Into Network",
        "com.chainweb.devnet.debug": "",
    },
    "image": "curlimages/curl:latest",
    "profiles": ["debug"],
    "networks" : {
        f"{n}-internal": None for n in nodes
    } | {
        "p2p": None,
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
def debug(nodes: list[str]): return {
    "build": {
        "context": "./debug",
        "dockerfile": "Dockerfile"
    },
    "profiles": ["debug"],
    "entrypoint": [
        "/bin/bash",
        "-c"
    ],
    "environment": {
        "HEIGHT": "${HEIGHT:-latest}"
    },
    "command": [
        """
        source ./functions.sh
        info $$HEIGHT
        """
    ],
    "networks" : {
        f"{n}-internal": None for n in nodes
    } | {
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
    node_name,
    evm_cids,
    is_bootnode = False,
    mining = False,
    exposed = False
) -> Spec: 
    jwtsecret_config(node_name)
    payload_provider_config(node_name, evm_cids)
    return spec | {
        "secrets": {
            f"{node_name}-jwtsecret": {
                "file": f"./config/{node_name}/jwtsecret"
            }
        } | 
        ({
            f"{node_name}-evm-{cid}-p2p-secret": { 
                "file": f"./config/{node_name}/evm-{cid}-p2p-secret" 
            } for cid in evm_cids
        } | {
            f"{node_name}-consensus-p2p-key": {
                "file": f"./config/{node_name}-consensus-p2p.key.pem"
            }
        } | {
            f"{node_name}-consensus-p2p-certificate": {
                "file": f"./config/{node_name}-consensus-p2p.cert.pem"
            }
        } if is_bootnode else {}),

        "configs": {
            f"{node_name}-consensus-config": {
                "file": "./config/consensus-config.yaml"
            },
            f"{node_name}-payload-providers": {
                "file": f"./config/{node_name}/payload-providers.yaml"
            }
        } | { 
            f"{node_name}-chain-spec-{cid}": { 
                "file": f"chain-specs/chain-spec-{cid}.json" 
            } for cid in evm_cids
        },
        "networks": {
            f"{node_name}-internal": None,
        },
        "volumes": {
            f"{node_name}-consensus_data": None,
            f"{node_name}_logs": None,
        } | {
            f"{node_name}-evm-{cid}_data": None for cid in evm_cids
        },
        "services": {
            f"{node_name}-consensus": chainweb_consensus_service(
                node_name,
                evm_cids,
                is_bootnode = is_bootnode,
                mining = mining,
                exposed = exposed,
            )
        } | { 
            f"{node_name}-evm-{cid}": evm_chain(
                node_name,
                cid, 
                is_bootnode = is_bootnode,
                exposed = exposed,
            ) for cid in evm_cids
        } | ({
            f"{node_name}-mining-client": chainweb_mining_client(
                node_name,
                exposed = exposed,
            )
        } if mining else {}),
    }

# ############################################################################# #
# Project

def other_services(nodes: list[str]) -> Spec: return spec | {
    "services": {
        "allocations": allocations("bootnode", 20),
        "curl": curl(nodes),
        "debug": debug(nodes),
    },
}

# ############################################################################# #
# COMPOSE PROJECT DEFINITION
# ############################################################################# #

def project() -> Spec: 

    nodes = ["bootnode", "appdev"]

    # Create boostrap information
    bootstrap_evm_cids = list(range(20, 40))

    # Create bootstrap node IDs
    evm_bootnodes("bootnode", bootstrap_evm_cids)

    top = spec | { 
        "name": "chainweb-evm",
        "networks": {
            f"p2p": None,
        },
    }
    return join_specs([
        top,
        chainweb_node(
            "bootnode",
            bootstrap_evm_cids,
            is_bootnode = True,
            mining = True,
            exposed = False,
        ),
        chainweb_node(
            "appdev",
            [20],
            is_bootnode = False,
            mining = False,
            exposed = True,
        ),
        other_services(nodes),
    ]) 


# #############################################################################
# main

parser=argparse.ArgumentParser()
parser.add_argument("--evm-chains")
args=parser.parse_args()

# All available EVM chains
if args.evm_chains is None:
    evm_cids = list(range(20,40))
else:
    evm_cids = list(map(int, args.evm_chains.split(",")))

# print the docker-compose file
print(json.dumps(project(), indent=4))

