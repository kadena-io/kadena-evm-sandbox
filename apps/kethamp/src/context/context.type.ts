export type TPlaylist = {
  id: string;
  title: string;
}

type TChainId = `chain${number}`;

export type TList<T> = {
  title: string | null;
  list: T[];
}

export type TAccount = {
  name: string;
  chain: TChainId;
  address: string;
  balance: string;
}

export type TTransaction = {
  blobGasPrice: string | null;
  blobGasUsed: string | null;
  blockHash: string | null;
  blockNumber: number;
  contractAddress: string | null;
  cumulativeGasUsed: string | null;
  from: string | null;
  gasPrice: string | null;
  gasUsed: string | null;
  hash: string | null;
  index: number;
  logs: {
    event: string;
    args: string[];
  }[] | null
  logsBloom: string | null;
  network: string | null;
  status: number;
  title: string | null;
  to: string | null;
  _type: string | null;
}

export type TContext = {
  isLoading: boolean,
  deployments: {
    isDeployed: boolean,
    playlists: TPlaylist['id'][],
  },
  playlists: {
    isLoading: boolean,
    list: TPlaylist[],
    data: TPlaylist[],
  },
  accounts: {
    isLoading: boolean,
    list: TAccount[];
    data: {
      [key: TChainId]: {
        [key: string]: TAccount;
      }
    };
  },
  transactions: {
    isLoading: boolean,
    list: {
      block: TTransaction[] | null,
      network: TList<TTransaction>[] | null,
      filtered?: {
        network: TList<TTransaction>[] | null;
      },
    },
    data: TTransaction[] | null,
  },
  graph: {
    data: {
      [key: number]: TTransaction[];
    } | null;
    active: {
      transaction: TTransaction | null,
      account: TAccount | null,
      playlist: TPlaylist | null,
    },
    options: {
      isPlaying: boolean,
      progress: number,
      stepSize: number,
      maxStepCount: number,
    },
  },
  networks: {
    list: string[],
  },
};

export type TContextAction<T> = {
  payload?: T;
  type: string;
};
