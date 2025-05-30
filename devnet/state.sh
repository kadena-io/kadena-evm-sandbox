#!/usr/bin/env bash

export NODE=${1:-bootnode-consensus}

function get_summary_json() {
    docker compose run -i --rm curl -skL "https://${NODE}:1789/chainweb/0.0/evm-development/cut" |
    jq '{ 
        node: env.NODE,
        chain_0: .hashes."0".height,
        chain_1: .hashes."1".height,
        chain_19: .hashes."19".height,
        cut: .height
    }'
}

function get_summary() {
    docker compose run -i --rm curl -skL "https://${NODE}:1789/chainweb/0.0/evm-development/cut" |
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

echo Node: ${NODE}
get_summary

