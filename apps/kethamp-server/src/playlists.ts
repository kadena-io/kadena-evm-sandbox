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
    case "single": {
      const [single] = await getCrosschainPlaylist();
      return [single].map((d) => ({ ...d, id: 'crts-001' }));
    }
    case "singlebob": {
      const crosschainPlaylist = await getCrosschainPlaylist();
      const [lastItem] = crosschainPlaylist.slice(-1);
      return [lastItem].map((d) => ({ ...d, id: 'crtsb-001' }));
    }
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
      id: "crt-000",
      title: "Crosschain Transfer 100 KDA Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
      steps: [
        {
          id: "crt1",
          title: "Alice initiates a crosschain transfer to Bob on chain 0",
        },
        {
          id: "crt2",
          title:
            "Alice polls chain 0 for SPV proof of crosschain transfer initiation",
        },
        {
          id: "crt3",
          title:
            "Alice submits SPV proof to chain 1 to finalize crosschain transfer",
        },
      ],
    },
    {
      id: "crt-001",
      title: "Crosschain Transfer 100 KDA Alice to Charlie",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: charlie1,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
      steps: [
        {
          id: "crt4",
          title: "Alice initiates a crosschain transfer to Charlie on chain 0",
        },
        {
          id: "crt5",
          title:
            "Alice polls chain 0 for SPV proof of crosschain transfer initiation",
        },
        {
          id: "crt6",
          title:
            "Alice submits SPV proof to chain 1 to finalize crosschain transfer",
        },
      ],
    },
    {
      id: "crt-002",
      title: "Crosschain Transfer 50 KDA Bob to Charlie",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: charlie,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
      steps: [
        {
          id: "crt7",
          title: "Bob initiates a crosschain transfer to Charlie on chain 1",
        },
        {
          id: "crt8",
          title:
            "Bob polls chain 1 for SPV proof of crosschain transfer initiation",
        },
        {
          id: "crt9",
          title:
            "Bob submits SPV proof to chain 0 to finalize crosschain transfer",
        },
      ],
    },
    {
      id: "crt-003",
      title: "Crosschain Transfer 100 KDA charlie to charlie",
      type: "transfer",
      from: charlie1,
      fromNetwork: "kadena_devnet2",
      to: charlie,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
      steps: [
        {
          id: "crt10",
          title:
            "Charlie initiates a crosschain transfer to Charlie on chain 1",
        },
        {
          id: "crt11",
          title:
            "Charlie polls chain 1 for SPV proof of crosschain transfer initiation",
        },
        {
          id: "crt12",
          title:
            "Charlie submits SPV proof to chain 0 to finalize crosschain transfer",
        },
      ],
    },
    {
      id: "crt-004",
      title: "Crosschain Transfer 150 KDA charlie to Bob",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("150"),
      steps: [
        {
          id: "crt13",
          title: "Charlie initiates a crosschain transfer to Bob on chain 0",
        },
        {
          id: "crt14",
          title:
            "Charlie polls chain 0 for SPV proof of crosschain transfer initiation",
        },
        {
          id: "crt15",
          title:
            "Charlie submits SPV proof to chain 1 to finalize crosschain transfer",
        },
      ],
    },
    {
      id: "crt-005",
      title: "Crosschain Transfer 100 KDA Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
      steps: [
        {
          id: "crt16",
          title: "Bob initiates a crosschain transfer to Alice on chain 1",
        },
        {
          id: "crt17",
          title:
              "Bob polls chain 1 for SPV proof of crosschain transfer initiation",
        },
        {
          id: "crt18",
          title:
              "Bob submits SPV proof to chain 0 to finalize crosschain transfer",
        },
      ],
    },
    {
      id: "crt-006",
      title: "Crosschain Transfer 100 KDA Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
      steps: [
        {
          id: "crt19",
          title: "Bob initiates a crosschain transfer to Alice on chain 1",
        },
        {
          id: "crt20",
          title:
              "Bob polls chain 1 for SPV proof of crosschain transfer initiation",
        },
        {
          id: "crt21",
          title:
              "Bob submits SPV proof to chain 0 to finalize crosschain transfer",
        },
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
      id: "c0-000",
      title: "Transfer 100 KDA Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
      steps: [{ id: "c01", title: "Alice transfers to Bob on chain 0" }],
    },
    {
      id: "c0-001",
      title: "Transfer 200 KDA Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("200"),
      steps: [{ id: "c02", title: "Alice transfers to Bob on chain 0" }],
    },
    {
      id: "c0-002",
      title: "Transfer 50 KDA Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
      steps: [{ id: "c03", title: "Bob transfers to Alice on chain 0" }],
    },
    {
      id: "c0-003",
      title: "Transfer 50 KDA Bob to charlie",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: charlie,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
      steps: [{ id: "c04", title: "Bob transfers to Charlie on chain 0" }],
    },
    {
      id: "c0-004",
      title: "Transfer 50 KDA Alice to charlie",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
      steps: [{ id: "c05", title: "Charlie transfers to Alice on chain 0" }],
    },
    {
      id: "c0-005",
      title: "Transfer 100 KDA Alice to charlie",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet1",
      to: charlie,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
      steps: [{ id: "c06", title: "Alice transfers to Charlie on chain 0" }],
    },
    {
      id: "c0-006",
      title: "Transfer 50 KDA charlie to Bob",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet1",
      to: bob,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
      steps: [{ id: "c07", title: "Charlie transfers to Bob on chain 0" }],
    },
    {
      id: "c0-007",
      title: "Transfer 150 KDA Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("150"),
      steps: [{ id: "c08", title: "Bob transfers to Alice on chain 0" }],
    },
    {
      id: "c0-008",
      title: "Transfer 50 KDA charlie to Alice",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("50"),
      steps: [{ id: "c09", title: "Charlie transfers to Alice on chain 0" }],
    },
    {
      id: "c0-009",
      title: "Transfer 100 KDA Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet1",
      to: alice,
      toNetwork: "kadena_devnet1",
      amount: hre.ethers.parseEther("100"),
      steps: [{ id: "c010", title: "Bob transfers to Alice on chain 0" }],
    },
  ];
  return playlist;
};

const getChain1Playlist = async () => {
  await hre.switchNetwork("kadena_devnet2");
  const [, alice, bob, charlie] = await hre.ethers.getSigners();
  const playlist: Track[] = [
    {
      id: "c1-000",
      title: "Transfer 100 KDA Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
      steps: [{ id: "c11", title: "Bob transfers to Alice on chain 1" }],
    },
    {
      id: "c1-001",
      title: "Transfer 100 KDA Bob to Alice",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("200"),
      steps: [{ id: "c12", title: "Bob transfers to Alice on chain 1" }],
    },
    {
      id: "c1-002",
      title: "Transfer 50 KDA Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
      steps: [{ id: "c13", title: "Alice transfers to Bob on chain 1" }],
    },
    {
      id: "c1-003",
      title: "Transfer 50 KDA Alice to charlie",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: charlie,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
      steps: [{ id: "c14", title: "Alice transfers to Charlie on chain 1" }],
    },
    {
      id: "c1-004",
      title: "Transfer 50 KDA charlie to Bob",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
      steps: [{ id: "c15", title: "Charlie transfers to Bob on chain 1" }],
    },
    {
      id: "c1-005",
      title: "Transfer 100 KDA charlie to Bob",
      type: "transfer",
      from: bob,
      fromNetwork: "kadena_devnet2",
      to: charlie,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
      steps: [{ id: "c16", title: "Bob transfers to Charlie on chain 1" }],
    },
    {
      id: "c1-006",
      title: "Transfer 50 KDA charlie to Alice",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet2",
      to: alice,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
      steps: [{ id: "c17", title: "Charlie transfers to Alice on chain 1" }],
    },
    {
      id: "c1-007",
      title: "Transfer 150 KDA Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("150"),
      steps: [{ id: "c18", title: "Alice transfers to Bob on chain 1" }],
    },
    {
      id: "c1-008",
      title: "Transfer 50 KDA charlie to Bob",
      type: "transfer",
      from: charlie,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("50"),
      steps: [{ id: "c19", title: "Charlie transfers to Bob on chain 1" }],
    },
    {
      id: "c1-009",
      title: "Transfer 100 KDA Alice to Bob",
      type: "transfer",
      from: alice,
      fromNetwork: "kadena_devnet2",
      to: bob,
      toNetwork: "kadena_devnet2",
      amount: hre.ethers.parseEther("100"),
      steps: [{ id: "c110", title: "Alice transfers to Bob on chain 1" }],
    },
  ];
  return playlist;
};
