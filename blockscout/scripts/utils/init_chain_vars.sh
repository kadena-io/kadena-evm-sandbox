#!/bin/bash

# Ensure utils.sh is sourced
source ./scripts/utils/utils.sh

# Set default values or take from input
chainIdOffset=${1:-1789}
chainwebChainIdOffset=${2:-20}
numberOfChains=${3:-5}

start=$((chainwebChainIdOffset))
end=$((chainwebChainIdOffset + numberOfChains - 1)) # -1 so numberOfChains is accurate

# Generate chains_meta
chains_meta=$(generate_chains_meta "$start" "$end")
export CHAINS_META="$chains_meta"