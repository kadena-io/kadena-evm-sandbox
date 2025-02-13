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
  const [, alice, ,charlie] = await hre.ethers.getSigners();
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
    },
    {
      title: "Crosschain Transfer from Alice to charlie",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: charlie1,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
    },
    {
      title: "Crosschain Transfer from Bob to charlie",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: charlie,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Crosschain Transfer from charlie to charlie",
      type: "transfer",
      from: charlie1,
      fromNetwork: "kadena_devnet2",
      to: charlie,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
    },
    {
      title: "Crosschain Transfer from charlie to Bob",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("150"),
    },
    {
      title: "Crosschain Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("200"),
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
    },
    {
      title: "Transfer from Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("200"),
    },
    {
      title: "Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Transfer from Bob to charlie",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: charlie,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Transfer from Alice to charlie",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Transfer from Alice to charlie",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: charlie,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
    },
    {
      title: "Transfer from charlie to Bob",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("150"),
    },
    {
      title: "Transfer from charlie to Alice",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
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
    },
    {
      title: "Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("200"),
    },
    {
      title: "Transfer from Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Transfer from Alice to charlie",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: charlie,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Transfer from charlie to Bob",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Transfer from charlie to Bob",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: charlie,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
    },
    {
      title: "Transfer from charlie to Alice",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Transfer from Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("150"),
    },
    {
      title: "Transfer from charlie to Bob",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Transfer from Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
    },
  ];
  return playlist;
};
