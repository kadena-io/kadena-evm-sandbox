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
  const [, alice, greg] = await hre.ethers.getSigners();
  await hre.switchNetwork("kadena_devnet2");
  const [, , bob, greg1] = await hre.ethers.getSigners();
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
      title: "Crosschain Transfer from Alice to Greg",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: greg1,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
    },
    {
      title: "Crosschain Transfer from Bob to Greg",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: greg,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Crosschain Transfer from Greg to Greg",
      type: "transfer",
      from: greg1,
      fromNetwork: "kadena_devnet2",
      to: greg,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
    },
    {
      title: "Crosschain Transfer from Greg to Bob",
      type: "transfer",
      from: greg,
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
  const [, alice, bob, greg] = await hre.ethers.getSigners();
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
      title: "Transfer from Bob to Greg",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: greg,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Transfer from Alice to Greg",
      type: "transfer",
      from: greg,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Transfer from Alice to Greg",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: greg,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
    },
    {
      title: "Transfer from Greg to Bob",
      type: "transfer",
      from: greg,
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
      title: "Transfer from Greg to Alice",
      type: "transfer",
      from: greg,
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
  const [, alice, bob, greg] = await hre.ethers.getSigners();
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
      title: "Transfer from Alice to Greg",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: greg,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Transfer from Greg to Bob",
      type: "transfer",
      from: greg,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
    },
    {
      title: "Transfer from Greg to Bob",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: greg,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
    },
    {
      title: "Transfer from Greg to Alice",
      type: "transfer",
      from: greg,
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
      title: "Transfer from Greg to Bob",
      type: "transfer",
      from: greg,
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
