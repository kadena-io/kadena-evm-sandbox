import hre, { ethers } from "hardhat";
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
      id: "deploy-1",
      title: "Deploy KEWX on devnet1",
      type: "deploy",
      network: "kadena_devnet1",
    },
    {
      id: "deploy-2",
      title: "Deploy KEWX on devnet2",
      type: "deploy",
      network: "kadena_devnet2",
    },
    {
      id: "register-cross-chain-1",
      title: "Register cross-chain address",
      type: "register-cross-chain",
      networks: ["kadena_devnet1", "kadena_devnet2"],
    },
    {
      id: "fund-1",
      title: "Fund Alice on devnet1",
      type: "fund",
      network: "kadena_devnet1",
      address: alice.address,
    },
    {
      id: "fund-2",
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
  const KEWX = await hre.ethers.getContractFactory("SimpleToken");
  const kewx = await KEWX.deploy(hre.ethers.parseEther("1000000"));
  const receipt = await kewx.deploymentTransaction()?.wait();
  await saveContracts({
    [track.network]: await kewx.getAddress(),
  });
  await saveTx(track.network, receipt, track.title);
  return kewx;
};
const eventSigHash =
  "0x9d2528c24edd576da7816ca2bdaa28765177c54b32fb18e2ca18567fbc2a9550";
const crossChainTransfer = async (track: TransferTrack) => {
  await hre.switchNetwork(track.fromNetwork);
  const kewx = await getContract(track.fromNetwork);
  const tx = await kewx
    .connect(track.from)
    .transferCrossChain(
      track.to.address,
      track.amount,
      track.toNetwork === "kadena_devnet1" ? 0n : 1n
    );
  const receipt = await tx.wait();
  if (!receipt) throw new Error("Transaction failed");
  await saveTx(track.fromNetwork, receipt, `${track.title} - Start`, track.id);
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
  const kewxTo = await getContract(track.toNetwork);
  const txTo = await kewxTo
    .connect(track.to)
    .redeemCrossChain(track.to.address, track.amount, proof);
  await saveTx(
    track.toNetwork,
    await txTo.wait(),
    `${track.title} - End`,
    track.id
  );
};
const transfer = async (track: TransferTrack) => {
  if (track.fromNetwork !== track.toNetwork)
    return await crossChainTransfer(track);

  await hre.switchNetwork(track.fromNetwork);
  const kewx = await getContract(track.fromNetwork);
  const tx = await kewx
    .connect(track.from)
    .transfer(track.to.address, track.amount);
  const receipt = await tx.wait();
  await saveTx(track.fromNetwork, receipt, track.title, track.id);
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
  const kewx = await getContract(track.network);
  if (!kewx) throw new Error("Contract not deployed");
  const tx = await kewx
    .connect(owner)
    .transfer(track.address, hre.ethers.parseEther("1000"));
  await saveTx(track.network, await tx.wait(), track.title);
};
const registerCrossChain = async (track: RegisterCrossChainTrack) => {
  for (const network of track.networks) {
    await hre.switchNetwork(network);
    const kewx = await getContract(network);
    const address = await kewx.getAddress();
    for (const otherNetwork of track.networks) {
      if (network === otherNetwork) continue;
      await hre.switchNetwork(otherNetwork);
      const [owner] = await hre.ethers.getSigners();
      const tx = await kewx
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
const saveTx = async (
  network: NetworkId,
  newTx: any,
  title?: string,
  id?: string
) => {
  const currentTxs = await getTxs();
  const contracts = await getContracts();
  const allTxs = [
    ...currentTxs,
    {
      title,
      trackId: id,
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
    const kewx = await getContract(network);
    return hre.ethers.formatEther(
      await kewx.connect(address).balanceOf(address.address)
    );
  } catch (e) {
    return 0;
  }
};

const toJSON = (o: any) => {
  return o.map((p: any) => ({ ...p, amount: p.amount.toString() }));
};
export const app = new Elysia()
  .use(cors())
  .use(swagger())
  .get(
    "/accounts",
    async () => {
      await hre.switchNetwork("kadena_devnet1");
      const [owner, alice, bob, charlie] = await hre.ethers.getSigners();
      const chain0 = {
        alice: {
          address: alice.address,
          balance: await getBalance(alice, "kadena_devnet1"),
        },
        bob: {
          address: bob.address,
          balance: await getBalance(bob, "kadena_devnet1"),
        },
        charlie: {
          address: charlie.address,
          balance: await getBalance(charlie, "kadena_devnet1"),
        },
      };
      await hre.switchNetwork("kadena_devnet2");
      const [owner1, alice1, bob1, charlie1] = await hre.ethers.getSigners();
      const chain1 = {
        alice: {
          address: alice1.address,
          balance: await getBalance(alice1, "kadena_devnet2"),
        },
        bob: {
          address: bob1.address,
          balance: await getBalance(bob1, "kadena_devnet2"),
        },
        charlie: {
          address: charlie1.address,
          balance: await getBalance(charlie1, "kadena_devnet2"),
        },
      };

      return { chain0, chain1 };
    },
    {}
  )
  .get(
    "/playlist",
    async () => {
      return {
        chain0: toJSON(await getPlaylist("chain0")),
        chain1: toJSON(await getPlaylist("chain1")),
        crossChain: toJSON(await getPlaylist("crosschain")),
        single: toJSON(await getPlaylist("single")),
      };
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
