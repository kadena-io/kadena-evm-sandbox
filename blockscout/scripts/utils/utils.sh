#!/bin/bash


generate_chains_meta() {
  local start=$1
  local end=$2
  local json="["

  for ((i = start; i <= end; i++)); do
    item="{\"title\":\"Devnet@chain$i\",\"url\":\"http://chain-$i.evm.kadena.io:8000/\",\"group\":\"Mainnets\",\"icon\":\"https://www.kadena.io/favicon.ico\"}"
    json+="$item"
    if [[ $i -lt $end ]]; then
      json+=","
    fi
  done

  json+="]"
  echo "$json"
}

run() {
  local cmd="$*"
  echo ""
  printf "\033[1;34m%s\033[0m\n" "$cmd"
  eval "$cmd"
}