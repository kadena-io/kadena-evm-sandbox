#!/bin/bash


generate_chains_meta() {
  local start=$1
  local end=$2
  local json="["

  for ((i = start; i <= end; i++)); do
    item="{\"title\":\"chain$i@kadena_devnet\",\"url\":\"http://chain-$i.evm.kadena.local:8000/\",\"group\":\"Mainnets\",\"icon\":\"https://www.kadena.local/favicon.ico\"}"
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

info() {
  local msg="$*"
  echo ""
  printf "\033[1;90m%s\033[0m\n" "$msg"
}