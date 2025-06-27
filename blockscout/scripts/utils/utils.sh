#!/bin/bash

if [ -t 1 ] ; then
    B="\x1B[1;97m"
    RED="\x1B[31m"
    BRED="\x1B[1;31m"
    FRED="\x1B[2;31m"
    GREEN="\x1B[32m"
    YELLOW="\x1B[33m"
    BLUE="\x1B[34m"
    R="\x1B[0m"
else
    B=
    RED=
    BRED=
    FRED=
    GREEN=
    YELLOW=
    BLUE=
    R=
fi

generate_chains_meta() {
  local start=$1
  local end=$2
  local json="["

  if [[ "$BASE_GATEWAY_PUBLIC_PORT" == "80" || "$BASE_GATEWAY_PUBLIC_PORT" == "443" ]]; then
    port=""
  else
    port=":$BASE_GATEWAY_PUBLIC_PORT"
  fi

  for ((i = start; i <= end; i++)); do

    url="${HTTP_PROTOCOL}://chain-$i.${BASE_EXPLORER_DOMAIN}$port/" 
    item="{\"title\":\"chain$i\",\"url\":\"$url\",\"group\":\"${BASE_CHAINWEB_NAME}\",\"icon\":\"${url}assets/configs/network_icon.svg\"}"
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