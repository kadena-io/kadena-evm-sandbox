import hre from "hardhat";

export type NetworkId = "kadena_devnet1" | "kadena_devnet2";
export type DeployTrack = {
  type: "deploy";
  network: NetworkId;
};
export type RegisterCrossChainTrack = {
  type: "register-cross-chain";
  networks: NetworkId[];
};
export type FundTrack = {
  type: "fund";
  network: NetworkId;
  address: string;
};
export type HardhatEthersSigner = Awaited<
  ReturnType<typeof hre.ethers.getSigners>
>[number];
export type TransferTrack = {
  type: "transfer";
  from: HardhatEthersSigner;
  fromNetwork: NetworkId;
  to: HardhatEthersSigner;
  toNetwork: NetworkId;
  amount: bigint;
};
export type Track =
  | DeployTrack
  | RegisterCrossChainTrack
  | FundTrack
  | TransferTrack;
