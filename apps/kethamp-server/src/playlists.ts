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
      amount: 100n * 10n ** 2n,
    },
    {
      title: "Crosschain Transfer from Alice to Greg",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: greg1,
      toNetwork: "kadena_devnet2",
      amount: 100n * 10n ** 2n,
    },
    {
      title: "Crosschain Transfer from Bob to Greg",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: greg,
      toNetwork: "kadena_devnet1",
      amount: 50n * 10n ** 2n,
    },
    {
      title: "Crosschain Transfer from Greg to Greg",
      type: "transfer",
      from: greg1,
      fromNetwork: "kadena_devnet2",
      to: greg,
      toNetwork: "kadena_devnet1",
      amount: 100n * 10n ** 2n,
    },
    {
      title: "Crosschain Transfer from Greg to Bob",
      type: "transfer",
      from: greg,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: 150n * 10n ** 2n,
    },
    {
      title: "Crosschain Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: 200n * 10n ** 2n,
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
      amount: 100n * 10n ** 2n,
    },
    {
      title: "Transfer from Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet1",
      amount: 200n * 10n ** 2n,
    },
    {
      title: "Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: 50n * 10n ** 2n,
    },
    {
      title: "Transfer from Bob to Greg",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: greg,
      toNetwork: "kadena_devnet1",
      amount: 50n * 10n ** 2n,
    },
    {
      title: "Transfer from Alice to Greg",
      type: "transfer",
      from: greg,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: 50n * 10n ** 2n,
    },
    {
      title: "Transfer from Alice to Greg",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: greg,
      toNetwork: "kadena_devnet1",
      amount: 100n * 10n ** 2n,
    },
    {
      title: "Transfer from Greg to Bob",
      type: "transfer",
      from: greg,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet1",
      amount: 50n * 10n ** 2n,
    },
    {
      title: "Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: 150n * 10n ** 2n,
    },
    {
      title: "Transfer from Greg to Alice",
      type: "transfer",
      from: greg,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: 50n * 10n ** 2n,
    },
    {
      title: "Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: 100n * 10n ** 2n,
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
      amount: 100n * 10n ** 2n,
    },
    {
      title: "Transfer from Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet2",
      amount: 200n * 10n ** 2n,
    },
    {
      title: "Transfer from Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: 50n * 10n ** 2n,
    },
    {
      title: "Transfer from Alice to Greg",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: greg,
      toNetwork: "kadena_devnet2",
      amount: 50n * 10n ** 2n,
    },
    {
      title: "Transfer from Greg to Bob",
      type: "transfer",
      from: greg,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: 50n * 10n ** 2n,
    },
    {
      title: "Transfer from Greg to Bob",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: greg,
      toNetwork: "kadena_devnet2",
      amount: 100n * 10n ** 2n,
    },
    {
      title: "Transfer from Greg to Alice",
      type: "transfer",
      from: greg,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet2",
      amount: 50n * 10n ** 2n,
    },
    {
      title: "Transfer from Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: 150n * 10n ** 2n,
    },
    {
      title: "Transfer from Greg to Bob",
      type: "transfer",
      from: greg,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: 50n * 10n ** 2n,
    },
    {
      title: "Transfer from Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: 100n * 10n ** 2n,
    },
  ];
  return playlist;
};
