curl -X POST \
	-H "Content-Type: application/json" \
	--data '{
    "jsonrpc": "2.0",
    "method": "txpool_content",
    "params": [],
    "id": 1
  }' \
	http://localhost:1848/chainweb/0.0/evm-development/chain/{20,21,22,23,24}/evm/rpc
