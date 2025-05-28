# Devnet EVM

## Github Container Registry

Create a `GITHUB_TOKEN` env var with token with `packages:read` permission to
access the docker images. Then run:

```sh
# when using `gh`
gh auth token | docker login ghcr.io --username YOUR_USERNAME --password-stdin
# or manual token
echo "ghp<token>" |docker login ghcr.io -u <GITHUB_USERNAME> --password-stdin
```

## Run the project

From root of the repo cd to `devnet` directory, then with
(uv)[https://docs.astral.sh/uv/getting-started/installation]

```sh
cd devnet
# uv automatically installs dependencies and ensures the virtual environment
uv run python ./compose.py > docker-compose.yaml && docker compose up -d
```

## Vanilla Python

Alternatively you can copy the dependencies from
[./pyproject.toml](./pyproject.toml) and install the dependencies manually:

```sh
pip install pyyaml secp256k1
```

```sh
cd ./devnet
python ./compose.py > docker-compose.yaml && docker compose up -d
```

## Virtual environments

You can also use a virtual environment to run the devnet. This is useful if you
want to run python in a different version than the one installed in your system,
and you want to keep the packages isolated from the system packages.

We use `uv` here to manage the virtual environment, package versions and
dependencies. You can also use `venv` or `virtualenv` to create a virtual
environment.
