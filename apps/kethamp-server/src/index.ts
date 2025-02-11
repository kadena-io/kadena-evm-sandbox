import hre from "hardhat";
import { SimpleToken } from "../typechain-types";
import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import cors from "@elysiajs/cors";
import { readFile, writeFile } from "fs/promises";
import { existsSync, readFileSync } from "fs";
import {
  DeployTrack,
  NetworkId,
  Track,
  TransferTrack,
  FundTrack,
  RegisterCrossChainTrack,
} from "./types";
import { getPlaylist } from "./playlists";

const getDeployPlaylist = async () => {
  await hre.switchNetwork("kadena_devnet1");
  const [, alice] = await hre.ethers.getSigners();
  await hre.switchNetwork("kadena_devnet2");
  const [, , bob] = await hre.ethers.getSigners();
  const playlist: Track[] = [
    {
      title: "Deploy KDA on devnet1",
      type: "deploy",
      network: "kadena_devnet1",
    },
    {
      title: "Deploy KDA on devnet2",
      type: "deploy",
      network: "kadena_devnet2",
    },
    {
      title: "Register cross-chain address",
      type: "register-cross-chain",
      networks: ["kadena_devnet1", "kadena_devnet2"],
    },
    {
      title: "Fund Alice on devnet1",
      type: "fund",
      network: "kadena_devnet1",
      address: alice.address,
    },
    {
      title: "Fund Bob on devnet2",
      type: "fund",
      network: "kadena_devnet2",
      address: bob.address,
    },
  ];
  return playlist;
};

type ContractMeta = {
  [network: string]: string;
};
const reset = async () => {
  await writeFile(".contracts.json", "{}");
  await writeFile(".txs.json", "[]");
};
const saveContracts = async (contracts: ContractMeta) => {
  const currentContracts = existsSync(".contracts.json")
    ? JSON.parse(readFileSync(".contracts.json", "utf-8"))
    : {};
  await writeFile(
    ".contracts.json",
    JSON.stringify({ ...currentContracts, ...contracts })
  );
};
const getContracts = async () => {
  if (!existsSync(".contracts.json")) return {};
  const data = await readFile(".contracts.json", "utf-8");
  const contracts: ContractMeta = JSON.parse(data || "{}");
  const result: any = {};
  for (const [network, address] of Object.entries(contracts)) {
    await hre.switchNetwork(network);
    result[network] = await hre.ethers.getContractAt("SimpleToken", address);
  }
  return result;
};
const getContract = async (network: NetworkId): Promise<SimpleToken> => {
  const contracts = await getContracts();
  const contract = contracts[network];
  if (!contract) throw new Error("Contract not deployed");
  return contract;
};
const deploy = async (track: DeployTrack) => {
  await hre.switchNetwork(track.network);
  const KDA = await hre.ethers.getContractFactory("SimpleToken");
  const kda = await KDA.deploy(100n * 10n ** 18n);
  const receipt = await kda.deploymentTransaction()?.wait();
  await saveContracts({
    [track.network]: await kda.getAddress(),
  });
  await saveTx(track.network, receipt, track.title);
  return kda;
};
const eventSigHash =
  "0x9d2528c24edd576da7816ca2bdaa28765177c54b32fb18e2ca18567fbc2a9550";
const crossChainTransfer = async (track: TransferTrack) => {
  await hre.switchNetwork(track.fromNetwork);
  const kda = await getContract(track.fromNetwork);
  const tx = await kda
    .connect(track.from)
    .transferCrossChain(
      track.to.address,
      track.amount,
      track.toNetwork === "kadena_devnet1" ? 0n : 1n
    );
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction failed");
  await saveTx(track.fromNetwork, receipt, `${track.title} - Start`);
  const logIndex = receipt?.logs.findIndex(
    (log) => log.topics[0] === eventSigHash
  );
  // fetch SPV proof
  const proof = await getSPVProof({
    networkId: track.fromNetwork,
    height: receipt.blockNumber,
    txIdx: receipt.index,
    eventIdx: logIndex,
  });
  // send SPV proof to target chain
  await hre.switchNetwork(track.toNetwork);
  const kdaTo = await getContract(track.toNetwork);
  const txTo = await kdaTo
    .connect(track.to)
    .redeemCrossChain(track.to.address, track.amount, proof);
  await saveTx(track.toNetwork, await txTo.wait(), `${track.title} - End`);
};
const transfer = async (track: TransferTrack) => {
  if (track.fromNetwork !== track.toNetwork)
    return await crossChainTransfer(track);

  await hre.switchNetwork(track.fromNetwork);
  const kda = await getContract(track.fromNetwork);
  const tx = await kda
    .connect(track.from)
    .transfer(track.to.address, track.amount);
  const receipt = await tx.wait();
  await saveTx(track.fromNetwork, receipt, track.title);
};
const getSPVProof = async ({
  networkId,
  height,
  txIdx,
  eventIdx,
}: {
  networkId: NetworkId;
  height: number;
  txIdx: number;
  eventIdx: number;
}) => {
  const origin = {
    height,
    chain: networkId === "kadena_devnet1" ? 0 : 1,
    txIdx,
    eventIdx,
  };
  const target = networkId === "kadena_devnet1" ? 0 : 1;
  const res = await fetch(
    `http://localhost:1848/chainweb/0.0/evm-development/chain/${target}/spv/chain/${origin.chain}/height/${origin.height}/transaction/${origin.txIdx}/event/${origin.eventIdx}`
  );
  const proof = await res.json();
  const proofStr = JSON.stringify(proof);
  const hexProof = "0x" + Buffer.from(proofStr, "utf8").toString("hex");
  return hexProof;
};
const fund = async (track: FundTrack) => {
  await hre.switchNetwork(track.network);
  const [owner] = await hre.ethers.getSigners();
  const kda = await getContract(track.network);
  if (!kda) throw new Error("Contract not deployed");
  const tx = await kda
    .connect(owner)
    .transfer(track.address, 1000n * 10n ** 2n);
  await saveTx(track.network, await tx.wait(), track.title);
};
const registerCrossChain = async (track: RegisterCrossChainTrack) => {
  for (const network of track.networks) {
    await hre.switchNetwork(network);
    const kda = await getContract(network);
    const address = await kda.getAddress();
    for (const otherNetwork of track.networks) {
      if (network === otherNetwork) continue;
      await hre.switchNetwork(otherNetwork);
      const [owner] = await hre.ethers.getSigners();
      const tx = await kda
        .connect(owner)
        .setCrossChainAddress(network === "kadena_devnet1" ? 0n : 1n, address);
      await saveTx(network, await tx.wait(), `${track.title} - ${network}`);
    }
  }
};
export const play = async (track: Track) => {
  if (track.type === "deploy") return await deploy(track);
  if (track.type === "fund") return await fund(track);
  if (track.type === "transfer") return await transfer(track);
  if (track.type === "register-cross-chain")
    return await registerCrossChain(track);
  throw new Error("Unknown track type");
};

const playPlaylist = async (playList: Track[]) => {
  for (const track of playList) {
    console.warn("DEBUGPRINT[97]: playlist.ts:169: track=", track.type);
    try {
      await play(track);
    } catch (e) {
      console.error("Error in track", e);
    }
  }
};
const getTxs = async () => {
  if (!existsSync(".txs.json")) return [];
  const data = await readFile(".txs.json", "utf-8");
  return JSON.parse(data || "[]") as any[];
};
const saveTx = async (network: NetworkId, newTx: any, title?: string) => {
  const currentTxs = await getTxs();
  const contracts = await getContracts();
  const allTxs = [
    ...currentTxs,
    {
      title,
      ...newTx.toJSON(),
      network,
      logs: newTx.logs.map((log: any) => {
        const x = contracts.kadena_devnet1?.interface.parseLog(log);
        return {
          event: x?.fragment.format(),
          args: x?.args.map((arg: any) => arg.toString()),
        };
      }),
    },
  ];
  await writeFile(".txs.json", JSON.stringify(allTxs));
};
const getBalance = async (address: any, network: NetworkId) => {
  try {
    await hre.switchNetwork(network);
    const kda = await getContract(network);
    return hre.ethers.FixedNumber.fromValue(
      await kda.connect(address).balanceOf(address.address),
      18
    ).toString();
  } catch (e) {
    return 0;
  }
};

export const app = new Elysia()
  .use(cors())
  .use(swagger())
  .get(
    "/accounts",
    async () => {
      await hre.switchNetwork("kadena_devnet1");
      const [owner, alice, bob, greg] = await hre.ethers.getSigners();
      const chain0 = {
        alice: {
          address: alice.address,
          balance: await getBalance(alice, "kadena_devnet1"),
        },
        bob: {
          address: bob.address,
          balance: await getBalance(bob, "kadena_devnet1"),
        },
        greg: {
          address: greg.address,
          balance: await getBalance(greg, "kadena_devnet1"),
        },
      };
      await hre.switchNetwork("kadena_devnet2");
      const [owner1, alice1, bob1, greg1] = await hre.ethers.getSigners();
      const chain1 = {
        alice: {
          address: alice1.address,
          balance: await getBalance(alice1, "kadena_devnet2"),
        },
        bob: {
          address: bob1.address,
          balance: await getBalance(bob1, "kadena_devnet2"),
        },
        greg: {
          address: greg1.address,
          balance: await getBalance(greg1, "kadena_devnet2"),
        },
      };

      return { chain0, chain1 };
    },
    {}
  )
  .post(
    "/playlist",
    async (req) => {
      const playlist = await getPlaylist(req.body.list);
      playPlaylist(playlist);
      return "queued";
    },
    {
      body: t.Object({
        list: t.String(),
      }),
    }
  )
  .post(
    "/deploy",
    async () => {
      await reset();
      const playlist = await getDeployPlaylist();
      playPlaylist(playlist);
      return "deploying...";
    },
    {}
  )
  .get(
    "/txs",
    async () => {
      return await getTxs();
    },
    {}
  )
  .listen(1337);
