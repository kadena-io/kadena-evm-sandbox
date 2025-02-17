import hre from "hardhat";
import { Track } from "./types";

export const getPlaylist = async (list: string) => {
  switch (list) {
    case "crosschain":
      return await getCrosschainPlaylist();
    case "chain0":
      return await getChain0Playlist();
    case "chain1":
      return await getChain1Playlist();
    default:
      return [];
  }
};
const getCrosschainPlaylist = async () => {
  await hre.switchNetwork("kadena_devnet1");
  const [, alice, , charlie] = await hre.ethers.getSigners();
  await hre.switchNetwork("kadena_devnet2");
  const [, , bob, charlie1] = await hre.ethers.getSigners();
  const playlist: Track[] = [
    {
      title: "Crosschain Transfer from Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
      steps: [
        "Alice initiates a crosschain transfer to Bob on chain 0",
        "Alice polls chain 0 for the SPV proof of the initiation of the crosschain transfer",
        "Alice submits the SPV proof to chain 1 to finalize the crosschain transfer",
      ],
    },
    {
      title: "Crosschain Transfer from Alice to Charlie",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: charlie1,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
      steps: [
        "Alice initiates a crosschain transfer to Charlie on chain 0",
        "Alice polls chain 0 for the SPV proof of the initiation of the crosschain transfer",
        "Alice submits the SPV proof to chain 1 to finalize the crosschain transfer",
      ],
    },
    {
      title: "Crosschain Transfer from Bob to Charlie",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: charlie,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
      steps: [
        "Bob initiates a crosschain transfer to Charlie on chain 1",
        "Bob polls chain 1 for the SPV proof of the initiation of the crosschain transfer",
        "Bob submits the SPV proof to chain 0 to finalize the crosschain transfer",
      ],
    },
    {
      title: "Crosschain Transfer from charlie to charlie",
      type: "transfer",
      from: charlie1,
      fromNetwork: "kadena_devnet2",
      to: charlie,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
      steps: [
        "Charlie initiates a crosschain transfer to Charlie on chain 1",
        "Charlie polls chain 1 for the SPV proof of the initiation of the crosschain transfer",
        "Charlie submits the SPV proof to chain 0 to finalize the crosschain transfer",
      ],
    },
    {
      title: "Crosschain Transfer from charlie to Bob",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("150"),
      steps: [
        "Charlie initiates a crosschain transfer to Bob on chain 0",
        "Charlie polls chain 0 for the SPV proof of the initiation of the crosschain transfer",
        "Charlie submits the SPV proof to chain 1 to finalize the crosschain transfer",
      ],
    },
    {
      title: "Crosschain Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("200"),
      steps: [
        "Bob initiates a crosschain transfer to Alice on chain 1",
        "Bob polls chain 1 for the SPV proof of the initiation of the crosschain transfer",
        "Bob submits the SPV proof to chain 0 to finalize the crosschain transfer",
      ],
    },
  ];
  return playlist;
};
const getChain0Playlist = async () => {
  await hre.switchNetwork("kadena_devnet1");
  const [, alice, bob, charlie] = await hre.ethers.getSigners();
  const playlist: Track[] = [
    {
      title: "Transfer from Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
      steps: ["Alice transfers to Bob on chain 0"],
    },
    {
      title: "Transfer from Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("200"),
      steps: ["Alice transfers to Bob on chain 0"],
    },
    {
      title: "Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
      steps: ["Bob transfers to Alice on chain 0"],
    },
    {
      title: "Transfer from Bob to charlie",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: charlie,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
      steps: ["Bob transfers to Charlie on chain 0"],
    },
    {
      title: "Transfer from Alice to charlie",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
      steps: ["Charlie transfers to Alice on chain 0"],
    },
    {
      title: "Transfer from Alice to charlie",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: charlie,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
      steps: ["Alice transfers to Charlie on chain 0"],
    },
    {
      title: "Transfer from charlie to Bob",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
      steps: ["Charlie transfers to Bob on chain 0"],
    },
    {
      title: "Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("150"),
      steps: ["Bob transfers to Alice on chain 0"],
    },
    {
      title: "Transfer from charlie to Alice",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
      steps: ["Charlie transfers to Alice on chain 0"],
    },
    {
      title: "Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
      steps: ["Bob transfers to Alice on chain 0"],
    },
  ];
  return playlist;
};

const getChain1Playlist = async () => {
  await hre.switchNetwork("kadena_devnet2");
  const [, alice, bob, charlie] = await hre.ethers.getSigners();
  const playlist: Track[] = [
    {
      title: "Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
      steps: ["Bob transfers to Alice on chain 1"],
    },
    {
      title: "Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("200"),
      steps: ["Bob transfers to Alice on chain 1"],
    },
    {
      title: "Transfer from Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
      steps: ["Alice transfers to Bob on chain 1"],
    },
    {
      title: "Transfer from Alice to charlie",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: charlie,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
      steps: ["Alice transfers to Charlie on chain 1"],
    },
    {
      title: "Transfer from charlie to Bob",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
      steps: ["Charlie transfers to Bob on chain 1"],
    },
    {
      title: "Transfer from charlie to Bob",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: charlie,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
      steps: ["Bob transfers to Charlie on chain 1"],
    },
    {
      title: "Transfer from charlie to Alice",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
      steps: ["Charlie transfers to Alice on chain 1"],
    },
    {
      title: "Transfer from Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("150"),
      steps: ["Alice transfers to Bob on chain 1"],
    },
    {
      title: "Transfer from charlie to Bob",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
      steps: ["Charlie transfers to Bob on chain 1"],
    },
    {
      title: "Transfer from Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
      steps: ["Alice transfers to Bob on chain 1"],
    },
  ];
  return playlist;
};
