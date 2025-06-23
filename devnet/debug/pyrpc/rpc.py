import os
import time
import requests
import jwt

# ############################################################################ #
# Types

type Url = str
type Method = str
type JwtToken = str

# ############################################################################ #
# Exceptions

class RpcException(Exception):
    "An exception raised by an RPC call"

class RpcHttpStatusException(RpcException):
    "An exception raised by an RPC HTTP status code other than 200"

class RpcErrorException(RpcException):
    "An exception raised by an RPC call error"

    def __init__(self, error):
        super().__init__(f"RPC error: {error}")
        self.error = error

# ############################################################################ #
# JWT Token

def get_jwt_secret(jwt_secret_path: str|None = None, jwt_secret_var: str = 'JWT_SECRET'):
    "Get a JWT secret from the given path or environment variable"
    jwt_secret = os.environ.get(jwt_secret_var, None)
    if jwt_secret is None:
        if jwt_secret_path is None:
            raise ValueError("No JWT secret path or environment variable provided")
        with open(file=jwt_secret_path, mode="r", encoding="utf-8") as f:
            jwt_secret = f.read().strip()
    return jwt_secret

def get_token(jwt_secret_path):
    "Get a JWT token from the given path or environment variable"
    return mk_token(get_jwt_secret(jwt_secret_path))

def mk_token(secret):
    "Create a JWT token from the given secret"
    algorithm = "HS256"
    secret_bytes_obj = bytes.fromhex(secret)
    payload = {
        "iat": int(time.time()),
        # "iss": os.environ.get("JWT_PASSWORD"),
    }
    token = jwt.encode(payload, secret_bytes_obj, algorithm=algorithm)
    # print(f"{token}")
    return token

# ############################################################################ #
# RPC

class RPC:
    "A simple JSON-RPC client"
    def __init__(self, url: Url):
        self.url = url
        self.rid = 1

    def rpc(self, method: Method, params: list|None = None, token: JwtToken|None = None):
        "Make an RPC call"

        rid = self.rid
        self.rid += 1

        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params,
            "id": rid,
        }

        headers = {
            "Content-Type": "application/json",
        }

        if token is not None:
            headers["Authorization"] = f"Bearer {token}"

        r = requests.post(self.url, json=payload, headers=headers, timeout=1)
        if r.status_code != 200:
            msg = f"Http status code exception for method {method}: {r.text}"
            print(msg)
            raise RpcException(msg)

        j = r.json()
        assert j.get("id") == rid, f"RPC response id mismatch. Expected {rid}, got {j.get('id')}"

        if j.get("error") is not None:
            e = j.get("error")
            msg = f"RPC method {method} failed: {e}, params: {params}"
            print(msg)
            raise RpcErrorException(e)

        return j.get("result")

# ############################################################################ #
# Authenticated RPC

class AuthRPC(RPC):
    "An authenticated JSON-RPC client"
    def __init__(self, url: Url, jwt_secret):
        super().__init__(url)
        self.jwt_secret = jwt_secret

    def rpc(self, method: Method, params: list|None = None, token: JwtToken|None = None):
        "Make an authenticated RPC call"
        if token is None:
            token = mk_token(self.jwt_secret)
        return super().rpc(method, params, token=token)

