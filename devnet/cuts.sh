#!/usr/bin/env bash

nodes=$(docker compose ps --format=json | jq -r '.Name | select(. | contains("consensus"))')

function get_hashes() {
    docker compose run --rm -T curl \
        -sLk \
        "http://${node}:1848/chainweb/0.0/evm-development/chain/0/hash/branch?limit=20" \
        -XPOST \
        -H 'content-type:application/json' \
        -d '{"upper": '"$1"', "lower":[]}' |
    jq '.items'
}

avgAndVariance() {  
    python3 -c '
import json;
from sys import stdin;
from statistics import variance, mean;
hs = [float(i) for i in stdin.read().split()];
print(json.dumps({ "min": min(hs), "max": max(hs), "mean": mean(hs), "variance": variance(hs) }));
    ' 
}

declare -A hashes
export hashes
for node in ${nodes}; do
    echo -n "${node}: "
    cut=$(docker compose run --rm -T curl -sLk "https://${node}:1789/chainweb/0.0/evm-development/cut")
    cid0=$(echo -n "$cut" | jq -c '[.hashes."0".hash]')
    hashes[${node}]=$(get_hashes "$cid0")
    {
        echo "$cut" | jq -c '{ cut: .height, chain_0: (.hashes."0".height) }'
        echo "$cut" | jq '.hashes.[].height' | avgAndVariance
    } | jq -s '.[0] * .[1]'
done

echo
echo "largest difference on chain 0 between any two nodes":
for a in "${hashes[@]}"; do
    for b in "${hashes[@]}"; do
        echo $(echo "{}" | jq "${a} - ${b} | length")
    done
done | sort -n | tail -1

echo "forks on chain 0 between any two nodes":
for a in "${hashes[@]}"; do
    for b in "${hashes[@]}"; do
        x=$(echo $(echo "{}" | jq "${a} - ${b} | length"))
        y=$(echo $(echo "{}" | jq "${a} - ${b} | length"))
        if [ "$x" -lt "$y" -a "$x" -gt 0 ]; then
            echo $x
        elif [ "$y" -lt "$x" -a "$y" -gt 0 ]; then
            echo $y
        fi
    done
done

