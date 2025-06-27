#!/bin/bash

# Ensure utils.sh is sourced
source ./scripts/utils/utils.sh

required_vars=(
  "BASE_CHAINWEB_NAME:the name of the chainweb network (e.g., devnet, testnet, mainnet)"
  "BASE_CHAIN_ID_OFFSET:the chain id of the first chain"
  "BASE_CHAINWEB_CHAIN_ID_OFFSET:the chainweb-chain id of the first chain"
  "BASE_NUMBER_OF_CHAINS:number of chains"
  "BASE_EXPLORER_DOMAIN:the domain of the blockscout explorer"
  "BASE_CHAINWEB_NODE_PUBLIC_URL:the public URL of the chainweb node"
  "BASE_JSONRPC_HTTP_URL:the base url of JSON-RPC of chains for HTTP requests"
  "BASE_JSONRPC_WS_URL:the base url of JSON-RPC of chains for WS requests"
  "BASE_BLOCKSCOUT_DB_PASSWORD:the password for the Blockscout database"
  "BASE_STATS_DB_PASSWORD:the password for the stats database"
)

for entry in "${required_vars[@]}"; do
  var="${entry%%:*}"
  desc="${entry#*:}"
  if [ -z "${!var}" ]; then
    echo "Error: $var is not set. It should be ${desc}."
    exit 1
  fi
done

chainIdOffset=${BASE_CHAIN_ID_OFFSET}
chainwebChainIdOffset=${BASE_CHAINWEB_CHAIN_ID_OFFSET}
numberOfChains=${BASE_NUMBER_OF_CHAINS}

start=$((chainwebChainIdOffset))
end=$((chainwebChainIdOffset + numberOfChains - 1)) # -1 so numberOfChains is accurate

if [[ "${BASE_TLS_ENABLED}" == "true" ]]; then
  export HTTP_PROTOCOL="https"
  export BASE_GATEWAY_PUBLIC_PORT="${BASE_GATEWAY_PUBLIC_HTTPS_PORT:-443}"
else
  export HTTP_PROTOCOL="http"
  export BASE_GATEWAY_PUBLIC_PORT="${BASE_GATEWAY_PUBLIC_HTTP_PORT:-80}"
fi

# Generate chains_meta
chains_meta=$(generate_chains_meta "$start" "$end")
export CHAINS_META="$chains_meta"
