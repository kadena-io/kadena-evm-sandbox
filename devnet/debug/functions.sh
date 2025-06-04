#!/usr/bin/env bash

export HEIGHT=${1:-${HEIGHT:-latest}}
export NODE=${2:-bootnode-consensus}
export EVMNODE=${3:-chainweb-consensus}

function info() {
  local height=${1}
  cut=$(get_cut $height)
  echo "${cut}" | 
    jq -cr '.hashes | to_entries[] | [.key, .value.hash] | @tsv' |
    while read -r cid hash ; do
      local header=$(get_block "$cid" "$hash")
      local payload_hash=$(echo $header | jq -rc '.payloadHash')
      local height=$(echo $header | jq -rc '.height')
      local payload=$(get_payload "$cid" "$payload_hash" "$height")
      local receipts=$(get_receipts "$cid" "$height")
      receipts=${receipts:-[]}
      # echo ${payload_hash} ${height} ${payload} ${receipts} 1>&2
      echo ${header} ${receipts} ${payload} | jq -n '{ receipts: input, payload: input } + input'
      done |
      jq -s --slurpfile cut <(echo "$cut") '
        {headers: [.[] | {key: (.chainId|tostring), value: .}] | sort_by(.key|tonumber) | from_entries}
      * ($cut[0] | del(.hashes))
      ' |
    jq 
}

function get_cut() {
  local height=${1}
  if [ "$height" = "latest" ] ; then
    curl -skL "https://${NODE}:1789/chainweb/0.0/evm-development/cut"
  else
    local cutheight=$(( $height * 20 ))
    curl -skL "https://${NODE}:1789/chainweb/0.0/evm-development/cut?maxheight=$cutheight"
  fi
}

function get_block_by_height() {
  local chain=${1}
  local height=${2}
  local uri="http://${NODE}:1848/chainweb/0.0/evm-development/chain/${chain}/header?minheight=$height&limit=1"
  curl -skL "$uri" -H 'accept:application/json;blockheader-encoding=object' | jq '.items[0]'
}

function get_block() {
  local chain=${1}
  local hash=${2}
  local uri="http://${NODE}:1848/chainweb/0.0/evm-development/chain/${chain}/header/${hash}"
  curl -skL "$uri" -H 'accept:application/json;blockheader-encoding=object'
}

function get_payload() {
  local chain=${1}
  local payload_hash=${2}
  local height=${3}
  local URI="https://${NODE}:1789/chainweb/0.0/evm-development/chain/${chain}/height/${height}/payload/${payload_hash}"
  curl -skL "$URI" | jq '.'
}

function get_receipts() {
  local chain=${1}
  local height=${2}
  local xheight=$(printf "0x%x" "$height")
  local uri="http://${EVMNODE}${chain}:8545"
  curl -skL "$uri" -XPOST -H "Content-Type:application/json" -d '{"method":"eth_getBlockReceipts","params":["'$xheight'"],"id":1,"jsonrpc":"2.0"}' |
  jq '.result'
}

function list_receipts_from_height() {
  local chain=${1}
  local height=${2}
  local xheight=$(printf "0x%x" "$height")
  local uri="http://${EVMNODE}${chain}:8545"
  curl -skL "$uri" -XPOST -H "Content-Type:application/json" -d '{"method":"eth_getLogs","params":[{"fromBlock":"'$xheight'"}],"id":1,"jsonrpc":"2.0"}' |
  jq '.result'
}

