# Build multiplatform images for the service of the compose project.
#
# > docker buildx bake --push
#
# Images are tagged ghcr.io/kadena-io/evm-devnet-<SERVICE_NAME>. The respective
# packages are publicly available and associciated with this repository.
#
# (see note below on building chainweb-node images)
#
# Multiplatfrom builds fails for chainweb-node (because the installation of GHC
# with ghcup fails).

# ############################################################################ #
# Variables

local_arch = split("/",BAKE_LOCAL_PLATFORM)[1]

variable "VERSION" {
  default = "latest"
}

variable "RETH_TAG" {
  default = "ghcr.io/kadena-io/evm-devnet-kadena-reth:${VERSION}"
}

variable "ALLOCATIONS_TAG" {
  default = "ghcr.io/kadena-io/evm-devnet-allocations:${VERSION}"
}

variable "CHAINWEB_NODE_TAG" {
  default = "ghcr.io/kadena-io/evm-devnet-chainweb-node:${VERSION}"
}

variable "SUPPORTED_PLATFORMS" {
  default = ["linux/arm64", "linux/amd64"]
}

# By default we build only for the local platform
variable "PLATFORMS" {
  default = [ "linux/${local_arch}" ]
  validation {
    condition = setintersection(PLATFORMS, SUPPORTED_PLATFORMS) == convert(PLATFORMS,set(string))
    error_message = "PLATFORMS can include only ${jsonencode(SUPPORTED_PLATFORMS)} but is ${jsonencode(PLATFORMS)}"
  }
}

# ############################################################################ #
# Groups

group "default" {
  targets = ["kadena-reth", "allocations", "chainweb-node"]
}

# ############################################################################ #
# Targets

target "kadena-reth" {
  context = "https://github.com/kadena-io/kadena-reth.git"
  tags = [ RETH_TAG ]
  platforms = PLATFORMS
  annotations = [
    "manifest:org.opencontainers.image.description=Reth with precompiles for the Kadena EVM devnet",
    "manifest:org.opencontainers.image.source=https://github.com/kadena-io/kadena-evm-sandbox"
  ]
}

target "allocations" {
  context = "./allocations"
  dockerfile = "Dockerfile"
  tags = [ ALLOCATIONS_TAG ]
  platforms = PLATFORMS
  annotations = [
    "manifest:org.opencontainers.image.description=Allocations for the Kadena EVM devnet",
    "manifest:org.opencontainers.image.source=https://github.com/kadena-io/kadena-evm-sandbox"
  ]
}

# Installing ghc with ghcup for a non-native platform is very slow and often
# fails. I therefor build and push only the linux/arm64 version and add the
# linux/amd64 version manually from the CI build in the chainweb repository.
#
# > docker buildx bake --push
# > docker buildx imagetools create --append ghcr.io/kadena-io/chainweb-node:lars-pp-evm --tag ghcr.io/kadena-io/evm-devnet-chainweb-node:latest
# 
target "chainweb-node" {
  context = "https://github.com/kadena-io/chainweb-node.git#lars/pp/evm"
  tags = [ CHAINWEB_NODE_TAG ]
  target = "chainweb-node"
  platforms = PLATFORMS
  annotations = [
    "manifest:org.opencontainers.image.description=Chainweb node for the Kadena EVM devnet",
    "manifest:org.opencontainers.image.source=https://github.com/kadena-io/kadena-evm-sandbox"
  ]
  args = {
    UNFREEZE = "true"
  }
}

