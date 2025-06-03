#!/usr/bin/env python3

import os
from dataclasses import dataclass, field
from enum import Enum
from statistics import mean, median
from typing import NewType
import aiohttp
import argparse
import asyncio
import base64
import json
import subprocess

DEFAULT_LIMIT = 30

# ############################################################################ #
# SHA512--256 hashes

# Decode as string of base64url encoded bytes
#
def b64d(b: str) -> bytes:
    return base64.urlsafe_b64decode(b + "==")


# Encode as base64url encoded bytes
def b64e(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode("utf-8").rstrip("=")


class Hashed(bytes):
    def __new__(cls, value: str | bytes):
        if isinstance(value, str):
            value = b64d(value)
        if isinstance(value, bytes):
            if len(value) != 32:
                raise ValueError(f"Hashed values must be 32 bytes, got {len(value)}")
            else:
                value = bytes(value)
        else:
            raise TypeError(f"Hashed values must be bytes, got {type(value)}")

    def __str__(self):
        return b64e(self)

    def __repr__(self):
        return f"Hashed({self})"


# ############################################################################ #

CutId = NewType("CutId", Hashed)
BlockHash = NewType("BlockHash", Hashed)
Node = str
ChainId = int
BlockHeight = int
RankedBlockHash = tuple[BlockHeight, BlockHash]
CutHeight = int

# Assigns set of nodes to ranked block hashes
Forks = list[dict[RankedBlockHash, frozenset[Node]]]

# Assignes to sets of nodes the maximum block height at which the nodes in the
# set agree on the block hash.
ForkPoints = dict[frozenset[Node], BlockHeight]


class ChainwebVersion(Enum):
    MAINNET = "mainnet01"
    TESTNET = "testnet04"
    DEVNET = "development"
    EVM_DEVNET = "evm-development"
    EVM_DEVNET_SINGLETON = "evm-development-singleton"
    EVM_DEVNET_PAIR = "evm-development-pair"


@dataclass(frozen=True)
class Cut:
    hashes: dict[ChainId, RankedBlockHash] = field(compare=False)
    weight: int = field(compare=True, hash=False)
    height: CutHeight = field(compare=False)
    instance: ChainwebVersion = field(compare=False)
    id: CutId = field(compare=True, hash=True)
    origin: str | None = field(default=None, compare=False)


# ############################################################################ #
# CHAINWEB API


# hashes are encodedd the API as base64 url without padding and must be decoded
# to bytes
async def get_cut(
    session: aiohttp.ClientSession,
    node: Node,
    *,
    version="evm-development"
) -> Cut|None:
    """
    Get the latest cut from the given node.
    Returns None if the node is not reachable.
    """
    uri = f"http://{node}/chainweb/0.0/{version}/cut"
    try:
        async with session.get(uri) as resp:
            json = await resp.json()
            if resp.status != 200:
                raise ValueError(f"Error: {resp.status} {resp}")
            return Cut(
                hashes={
                    # decode block height and block hash from base64 url
                    int(k): (v["height"], BlockHash(v["hash"]))
                    for k, v in json["hashes"].items()
                },
                weight=json["weight"],
                height=json["height"],
                instance=ChainwebVersion(json["instance"]),
                id=CutId(json["id"]),
                origin=json.get("origin"),
            )
    except aiohttp.ClientConnectorError as _:
        return None
    except aiohttp.ConnectionTimeoutError as _:
        return None


async def get_branch_hashes(
    session: aiohttp.ClientSession,
    node: Node,
    cid: ChainId,
    branch: BlockHash,
    *,
    limit: int = DEFAULT_LIMIT,
    version="evm-development",
) -> list[BlockHash]|None:
    """
    Get the branch hashes for the given chain id and branch hash.
    Returns None if the node is not reachable.
    """
    uri = f"http://{node}/chainweb/0.0/{version}/chain/{cid}/hash/branch"
    result: list[BlockHash] = []
    next = branch
    try:
        while len(result) < limit and next is not None:
            body = {
                "upper": [f"{next}"],
                "lower": [],
            }
            params = {"limit": limit - len(result)}
            async with session.post(uri, json=body, params=params) as resp:
                if resp.status != 200:
                    raise ValueError(f"Error: {resp.status} {resp}")
                json = await resp.json()
                result += json["items"]
                next = json["next"].split(":")[1] if json["next"] else None
        return result
    except aiohttp.ClientConnectorError as _:
        return None
    except aiohttp.ConnectionTimeoutError as _:
        return None


# ############################################################################ #


# Concurrenlty query latest cut from each node
#
async def cuts(
    session, 
    nodes: frozenset[Node],
    version: str = "evm-development"
) -> dict[Node, Cut|None]:
    async def run(n):
        c = await get_cut(session, n, version=version)
        return n, c

    jobs = [run(n) for n in nodes]
    results = await asyncio.gather(*jobs)
    return {key: value for key, value in results}


async def get_branches(
    session: aiohttp.ClientSession,
    node: Node,
    *,
    chains: list[ChainId] | None = None,
    limit: int = DEFAULT_LIMIT,
    version="evm-development",
) -> dict[ChainId, list[RankedBlockHash]]|None:
    cut = await get_cut(session, node, version=version)
    if cut is None:
        return None
    else:
        async def run(cid, h, bh):
            branch = await get_branch_hashes(
                session, node, cid, bh, limit=limit, version=version
            )
            if branch is None:
                return cid, None
            else:
                l = list(range(h + 1 - len(branch), h + 1))
                l.reverse()
                ranked = list(zip(l, branch))
                return cid, ranked

        results = await asyncio.gather(
            *[
                run(cid, h, bh)
                for cid, (h, bh) in cut.hashes.items()
                if chains is None or cid in chains
            ]
        )
        return {key: value for key, value in results if value is not None}


async def get_branches_for_all_nodes(
    session: aiohttp.ClientSession,
    nodes: frozenset[Node],
    *,
    chains: list[ChainId] | None = None,
    limit: int = DEFAULT_LIMIT,
    version="evm-development",
) -> dict[Node, dict[ChainId, list[RankedBlockHash]]]:
    async def run(n):
        branches = await get_branches(
            session, n, chains=chains, limit=limit, version=version
        )
        return n, branches

    jobs = [run(n) for n in nodes]
    results = await asyncio.gather(*jobs)
    return {key: value for key, value in results if value is not None}


# Find forks per chain:
#
def forks(x: dict[Node, list[RankedBlockHash]]) -> Forks:
    # reverse the order of blocks to start from lowest height
    # O(n * m)
    a = {k: v[::-1] for k, v in x.items()}

    # O(n * m)
    # start with the lowest block for which we have blocks on all nodes
    max_min_rank = max([v[0][0] for v in a.values() if len(v) > 0])
    # for node, hashes in a.items():
    #     if [ h for h, _ in hashes if h == max_min_rank ] == []:

    cur_rank = max_min_rank
    levels: dict[BlockHeight, dict[Node, BlockHash | None]] = {}
    done = False
    while not done:
        done = True
        for k, v in a.items():
            levels[cur_rank] = levels.get(cur_rank, {})
            if len(v) > 0 and v[0][0] == cur_rank:
                levels[cur_rank][k] = v[0][1]
                del a[k][0]
                done = False
            else:
                levels[cur_rank][k] = None
        cur_rank += 1

    # O(n * m * m)
    return [
        {
            (h, value): frozenset([key for key, val in level.items() if val == value])
            for value in frozenset(level.values())
            if value is not None
        }
        for h, level in levels.items()
    ]


def fork_points(a: Forks) -> ForkPoints:
    r = a.copy()
    r.reverse()
    fp: dict[frozenset[Node], BlockHeight] = {}
    for level in r:
        for (h, _), ns in level.items():
            if fp.get(ns) is None:
                fp[ns] = h
    return fp


def branches_for_chain(
    branches: dict[Node, dict[ChainId, list[RankedBlockHash]]],
    cid: ChainId
) -> dict[Node, list[RankedBlockHash]]:
    return {k: v[cid] for k, v in branches.items()}


async def get_fork_points(
    nodes: frozenset[Node],
    *,
    chains: list[ChainId] | None = None,
    version: str = "evm-development",
    limit: int = DEFAULT_LIMIT
) -> dict[ChainId, ForkPoints]:
    timeout = aiohttp.ClientTimeout(connect=1, total=2)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        branches = await get_branches_for_all_nodes(
            session,
            nodes,
            chains=chains,
            version=version,
            limit=limit
        )
        cids = frozenset(
            [
                cid
                for cid in sum([list(v.keys()) for v in branches.values()], [])
                if cid is not None
            ]
        )
        return {
            cid: fork_points(forks(branches_for_chain(branches, cid))) for cid in cids
        }


async def get_forks(
    nodes: frozenset[Node], *,
    chains: list[ChainId] | None = None,
    version: str = "evm-development",
    limit: int = DEFAULT_LIMIT
) -> dict[ChainId, Forks]:
    timeout = aiohttp.ClientTimeout(connect=1, total=2)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        branches = await get_branches_for_all_nodes(
            session,
            nodes,
            chains=chains,
            version=version,
            limit=limit
        )
        cids = frozenset(
            [
                cid
                for cid in sum([list(v.keys()) for v in branches.values()], [])
                if cid is not None
            ]
        )
        return {cid: forks(branches_for_chain(branches, cid)) for cid in cids}


# ############################################################################ #
# Docker project info

# nodes=$(docker compose ps --format=json | jq -r '.Name | select(. | contains("consensus"))')


def get_docker_project_nodes() -> frozenset[Node]:
    proc = subprocess.run(
        ["docker", "compose", "ps", "--format=json"],
        check=True,
        capture_output=True,
        text=True,
    )
    results = [json.loads(line) for line in proc.stdout.splitlines()]

    # fixme get or guess correct port number
    nodes = frozenset(
        [f"{n['Name']}:1848" for n in results if n["Name"].endswith("consensus")]
    )
    return nodes


# ############################################################################ #
# Summary


async def summary(nodes: frozenset[Node], version: str = "evm-development"):
    timeout = aiohttp.ClientTimeout(connect=0.5, total=1)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        cs = await cuts(session, nodes, version=version)
        def info(n):
            c = cs.get(n)
            if c is None:
                return None
            elif c is not None:
                hs = [h for h, _ in c.hashes.values()]
                return {
                    "cut.height": c.height,
                    "blockheight.avg": mean(hs),
                    "blockheight.median": median(hs),
                    "blockheight.min": min(hs),
                    "blockheight.max": max(hs),
                }

        print(json.dumps({n: info(n) for n in nodes}))


# ############################################################################ #
# Main


async def main(
    nodes: frozenset[Node],
    chains: list[ChainId] | None = None,
    forks: bool = False,
    version: str = "evm-development",
    limit: int = DEFAULT_LIMIT
):
    if forks:
        cfs = await get_forks(nodes, chains=chains, version=version, limit=limit)
        print(
            json.dumps(
                {
                    cid: [
                        [
                            {
                                "height": h,
                                "hash": hs,
                                "nodes": list(nodes),
                            }
                            for (h, hs), nodes in level.items()
                        ]
                        for level in fs
                    ]
                    for cid, fs in cfs.items()
                }
            )
        )
    else:
        fps = await get_fork_points(nodes, chains=chains, version=version, limit=limit)
        print(
            json.dumps(
                {
                    cid: [
                        {
                            "nodes": list(nodes),
                            "height": h,
                        }
                        for nodes, h in fp.items()
                    ]
                    for cid, fp in fps.items()
                }
            )
        )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    # TODO use the given docker project or the local project
    parser.add_argument("--project-name")  # TODO
    parser.add_argument("--chainweb-version")  # TODO
    parser.add_argument("--chains")
    parser.add_argument("--nodes")
    parser.add_argument("--depth")
    parser.add_argument(
        "--summary", action="store_true", help="Show cut summary of nodes"
    )
    parser.add_argument(
        "--forks",
        action="store_true",
        help="Show forks of nodes instead of fork points",
    )
    args = parser.parse_args()

    version = args.chainweb_version or "evm-development"
    limit = int(args.depth) if args.depth is not None else DEFAULT_LIMIT

    if args.nodes is not None:
        node_args = args.nodes.split(",")
        nodes = frozenset([f"{n}:1848" if ":" not in n else n for n in node_args])
    elif (env := os.getenv("CL_NODES")) is not None:
        node_args = env.split(",")
        nodes = frozenset([f"{n}:1848" if ":" not in n else n for n in node_args])
    else:
        nodes = get_docker_project_nodes()
        print(f"Found nodes: {nodes}")

    if args.chains is not None:
        chains = [int(c) for c in args.chains.split(",")]
    else:
        chains = None

    if args.summary:
        asyncio.run(summary(nodes, version))
        exit(0)
    else:
        asyncio.run(main(nodes, chains, args.forks, version=version, limit=limit))

# ############################################################################ #

# # Test
hist = {
    "a": [(0, b"a"), (1, b"b"), (2, "c"), (3, b"d")],
    "b": [(0, b"a"), (1, b"x"), (2, "y"), (3, b"z")],
    "c": [(0, b"a"), (1, b"x"), (2, "y"), (3, b"q")],
}


def run_tests():
    print(forks(hist))
    print(fork_points(forks(hist)))
