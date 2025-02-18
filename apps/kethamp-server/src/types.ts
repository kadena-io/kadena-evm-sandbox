import hre from "hardhat";

export type NetworkId = "kadena_devnet1" | "kadena_devnet2";
export type DeployTrack = {
  id: string;
  title: string;
  type: "deploy";
  network: NetworkId;
};
export type RegisterCrossChainTrack = {
  id: string;
  title: string;
  type: "register-cross-chain";
  networks: NetworkId[];
};
export type FundTrack = {
  id: string;
  title: string;
  type: "fund";
  network: NetworkId;
  address: string;
};
export type HardhatEthersSigner = Awaited<
  ReturnType<typeof hre.ethers.getSigners>
>[number];
export type Step = {
  id: string;
  title: string;
};
export type TransferTrack = {
  id: string;
  title: string;
  type: "transfer";
  from: HardhatEthersSigner;
  fromNetwork: NetworkId;
  to: HardhatEthersSigner;
  toNetwork: NetworkId;
  amount: bigint;
  steps: Step[];
};
export type Track =
  | DeployTrack
  | RegisterCrossChainTrack
  | FundTrack
  | TransferTrack;
