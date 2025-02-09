import hre from "hardhat";
import { Track } from "./types";

export const getPlaylist = async (list: string) => {
  switch (list) {
    case "crosschain":
      return await getCrosschainPlaylist();
    case "chain1":
      return await getChain1Playlist();
    default:
      return [];
  }
};
const getCrosschainPlaylist = async () => {
  await hre.switchNetwork("kadena_devnet1");
  const [, alice] = await hre.ethers.getSigners();
  await hre.switchNetwork("kadena_devnet2");
  const [, , bob] = await hre.ethers.getSigners();
  const playlist: Track[] = [
    {
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: 100n * 10n ** 2n,
    },
    {
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: 200n * 10n ** 2n,
    },
    {
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: 50n * 10n ** 2n,
    },
  ];
  return playlist;
};
const getChain1Playlist = async () => {
  await hre.switchNetwork("kadena_devnet1");
  const [, alice, bob, greg] = await hre.ethers.getSigners();
  const playlist: Track[] = [
    {
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet1",
      amount: 100n * 10n ** 2n,
    },
    {
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet1",
      amount: 200n * 10n ** 2n,
    },
    {
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: 50n * 10n ** 2n,
    },
    {
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: greg,
      toNetwork: "kadena_devnet1",
      amount: 50n * 10n ** 2n,
    },
    {
      type: "transfer",
      from: greg,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: 50n * 10n ** 2n,
    },
    {
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: greg,
      toNetwork: "kadena_devnet1",
      amount: 100n * 10n ** 2n,
    },
    {
      type: "transfer",
      from: greg,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet1",
      amount: 50n * 10n ** 2n,
    },
    {
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: 150n * 10n ** 2n,
    },
    {
      type: "transfer",
      from: greg,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: 50n * 10n ** 2n,
    },
    {
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
