#!/usr/bin/env bash

export NODE=${1:-bootnode-consensus}
export EVMNODE=${2:-chainweb-evm-chain}

function get_summary_json() {
    docker compose run -ti --rm curl -skL "https://${NODE}:1789/chainweb/0.0/evm-development/cut" |
    jq '{ 
        node: env.NODE,
        chain_0: .hashes."0".height,
        chain_1: .hashes."1".height,
        chain_19: .hashes."19".height,
        cut: .height
    }'
}

function get_summary() {
    docker compose run -ti --rm curl -skL "https://${NODE}:1789/chainweb/0.0/evm-development/cut" |
    jq -r '
        .height as $ch
        |
        [ .hashes
        | to_entries[]
        | 
            { chain: .key|tonumber
            , height: .value.height
            , hash: .value.hash
            , type: (if ((.key|tonumber) > 19 and (.key|tonumber) < 40) then "evm" else "default" end)
            # , provider_uri: (if ((.key|tonumber) < 2) then ("http://" + env.EVMNODE + "-" + .key + ":8551") else "--" end)
            # , URI: ("http://" + env.NODE + ":1848/chainweb/0.0/evm-development/chain/" + .key + "/header/" + .value.hash)
            } 
        | with_entries (.key |= ascii_downcase)
        ]
        | sort_by (.chain) 
        | (.[0] | keys_unsorted | @tsv)
        , (.[] | map(.) | @tsv)
        , "cut-height: " + ($ch|tostring)
    ' |
    column -t
}

get_summary

