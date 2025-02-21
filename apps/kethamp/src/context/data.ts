export const initialState = {
  isLoading: true,
  deployments: {
    isDeployed: false,
    playlists: null,
  },
  playlists: {
    isLoading: false,
    data: null,
    list: null,
  },
  accounts: {
    isLoading: false,
    list: [],
    data: {},
  },
  transactions: {
    isLoading: false,
    list: {
      block: null,
      network: null,
      filtered: {
        network: null,
      },
    },
    data: null,
  },
  graph: {
    data: null,
    active: {
      transaction: null,
      account: null,
      playlist: {
        item: null,
        track: {
          active: null,
          list: null,
          completed: null,
        },
      },
      tracks: null,
    },
    options: {
      isPlaying: false,
      progress: 0,
      stepSize: 10,
      maxStepCount: 0,
      volume: 1,
    },
  },
  networks: {
    list: [],
  },
};
