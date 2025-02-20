'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import useLocalStorage from '@app/hooks/localStorage';
import React from 'react';
import type {
  TAccount,
  TAsideList,
  TContext,
  TGroup,
  TList,
  TPlaylist,
  TTransaction,
  TTransferTrack,
} from './context.type';

const Context = React.createContext<TContext | null>(null);
const ContextDispatch = React.createContext(null) as unknown as React.Context<
  React.Dispatch<{ payload?: any; type: string }>
>;

const localStorageKey = 'kethamp';

const ContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [localState] = useLocalStorage<typeof initialState>(
    localStorageKey,
    initialState,
  );
  const [state, dispatch] = React.useReducer(stateReducer, {
    ...initialState,
    ...localState,
  });

  return (
    <Context.Provider value={state}>
      <ContextDispatch.Provider value={dispatch}>
        {children}
      </ContextDispatch.Provider>
    </Context.Provider>
  );
};

export function useContext() {
  return React.useContext(Context);
}

export function useContextDispatch() {
  return React.useContext(ContextDispatch);
}

function groupByStep(list: TGroupTransactions | undefined, step: number) {
  if (!list) {
    return {};
  }

  const grouped: Record<string, TTransaction[]> = {};
  const keys = Object.keys(list).map(parseFloat);

  const minKey = Math.floor(Math.min(...keys) / step) * step;
  const maxKey = Math.ceil(Math.max(...keys) / step) * step;

  for (let i = minKey; i <= maxKey; i += step) {
    grouped[i] = [];
  }

  keys.forEach((key) => {
    const groupKey = Math.floor(key / step) * step;
    grouped[groupKey]?.push(...list[key.toString()]);
  });

  return grouped;
}

type TGroupTransactions = Record<string, TTransaction[]>;
function groupTransactions(
  transactions: TTransaction[],
  stepSize: number,
): TGroupTransactions | undefined {
  if (transactions) {
    const minBlockNumber = transactions.reduce(
      (acc, d) => Math.min(acc, d?.blockNumber ?? 0),
      Infinity,
    );
    const lastBlockNumber = transactions.reduce(
      (acc, d) => Math.max(acc, d?.blockNumber ?? 0),
      0,
    );
    const duration = lastBlockNumber - minBlockNumber;
    const steps = 100 / duration;

    const transactionsByPercentage = transactions.reduce<TGroupTransactions>(
      (acc, d) => {
        const percentage =
          (((d?.blockNumber ?? 0) - minBlockNumber) / duration) * 100;
        const step = Math.floor(percentage * steps);

        return {
          ...acc,
          [percentage]: acc[step] ? [...acc[step], d] : [d],
        };
      },
      {},
    );

    return groupByStep(transactionsByPercentage, stepSize);
  }
}

function networks(transactions: TContext['transactions']['data']): string[] {
  if (!transactions) {
    return [];
  }

  return transactions.reduce<string[]>((acc, d) => {
    if (d.network && !acc.includes(d.network)) {
      return [...acc, d.network];
    }

    return acc;
  }, []);
}

function maxSize(data: TGroupTransactions | undefined): number {
  if (!data) return 0;

  return Math.max(0, ...Object.values(data).map((arr) => arr.length));
}

function getTransactionsList(
  state: TContext,
  graphData?: TContext['graph']['data'] | null,
): TTransaction[] {
  const { progress } = state.graph.options;

  if (graphData) {
    return graphData[progress] ?? [];
  }

  return state.graph.data?.[progress] ?? [];
}

function getTransactionsListByNetwork(
  state: TContext,
  networkList?: TContext['networks']['list'],
  graphData?: TContext['graph']['data'],
) {
  const { progress } = state.graph.options;
  let data = state.graph.data?.[progress] ?? [];

  if (graphData) {
    data = graphData[progress] ?? [];
  }

  if (!data) return [];

  const networks = networkList || state.networks.list;

  if (!networks) return [];

  return networks.reduce<TList<TTransaction>[]>((list, networkId) => {
    const filteredData = data.filter((d) => d.network === networkId);

    if (filteredData.length > 0) {
      list.push({
        title: networkId,
        list: filteredData,
      });
    }

    return list;
  }, []);
}

function getAccountsList(
  accounts: TContext['accounts']['data'],
): TContext['accounts']['list'] {
  return Object.entries(accounts).flatMap(
    ([chainKey, account]) =>
      Object.entries(account).map(([accountName, accountData]) => ({
        ...accountData,
        chain: chainKey,
        name: accountName,
      })) as TAccount[],
  );
}

function filterListByAccount(
  list: TList<TTransaction>[] | null,
  account: TAccount | null,
) {
  if (!list || !account) return list;

  return Object.values(list).reduce<TList<TTransaction>[]>((acc, item) => {
    acc.push({
      ...item,
      list: item.list?.filter(
        (entry) =>
          entry.from === account.address || entry.to === account.address,
      ),
    });

    return acc;
  }, []);
}

function getPlaylists(
  data: TContext['playlists']['data'],
): TAsideList<TPlaylist> | null {
  if (!data) return null;

  const playlists = {
    title: 'Playlists',
    groups: Object.entries(data).map(([id, { title, tracks }]) => ({
      id,
      title,
      list: tracks,
    })) as unknown as TAsideList<TPlaylist>['groups'],
  };

  return playlists;
}

function stateHook(state: TContext) {
  localStorage?.setItem(localStorageKey, JSON.stringify(state));

  return state;
}

function stateReducer(
  state: TContext,
  action: { payload?: any; type: string },
) {
  switch (action.type) {
    case 'UPDATE_DATA': {
      const graphData = groupTransactions(
        action.payload.transactions,
        state.graph.options.stepSize,
      );
      const networkData = networks(action.payload.transactions);

      return stateHook({
        ...state,
        networks: {
          ...state.networks,
          list: networkData,
        },
        accounts: {
          ...state.accounts,
          data: action.payload.accounts,
          list: getAccountsList(action.payload.accounts),
        },
        transactions: {
          ...state.transactions,
          data: action.payload.transactions,
          list: {
            block: getTransactionsList(state, graphData),
            network: getTransactionsListByNetwork(
              state,
              networkData,
              graphData,
            ),
          },
        },
        graph: {
          ...state.graph,
          data: graphData || null,
          options: {
            ...state.graph.options,
            maxStepCount: maxSize(graphData),
          },
        },
      });
    }

    case 'UPDATE_ACCOUNTS':
      return stateHook({
        ...state,
        accounts: {
          ...state.accounts,
          data: action.payload.accounts,
          list: [] /* accounts(action.payload.transactions) */,
        },
      });

    case 'UPDATE_TRANSCATIONS':
      return stateHook({
        ...state,
        transactions: action.payload.transactions,
      });

    case 'RESET_PROGRESS': {
      return stateHook({
        ...state,
        graph: {
          ...state.graph,
          options: {
            ...state.graph.options,
            progress: 0,
            isPlaying: false,
          },
        },
      });
    }

    case 'STOP_PROGRESS': {
      return stateHook({
        ...state,
        graph: {
          ...state.graph,
          options: {
            ...state.graph.options,
            isPlaying: false,
          },
        },
      });
    }

    case 'SET_PROGRESS': {
      const progress = action.payload.progress ?? state.graph.options.progress;
      let next = action.payload.next ?? 0;

      if (action.payload.direction === 'forwards') {
        if (progress < 100 && next > 100) {
          next = 100;
        }
      } else if (action.payload.direction === 'backwards') {
        if (progress > 0 && next < 0) {
          next = 0;
        }
      }

      const nextState = { ...state };
      nextState.graph.options.progress = next;

      return stateHook({
        ...state,
        transactions: {
          ...state.transactions,
          list: {
            block: getTransactionsList(nextState),
            network: getTransactionsListByNetwork(nextState),
          },
        },
        networks: {
          ...state.networks,
        },
        graph: {
          ...state.graph,
          options: {
            ...state.graph.options,
            isPlaying: action.payload.isPlaying || false,
            progress: action.payload.progress ?? next,
          },
        },
      });
    }

    case 'SET_ACTIVE_TRANSACTION': {
      let transaction =
        state?.transactions?.data?.find(
          (d) => d.hash === action.payload.hash,
        ) || null;

      if (state.graph.active.transaction?.hash === action.payload.hash) {
        transaction = null;
      }

      return stateHook({
        ...state,
        graph: {
          ...state.graph,
          active: {
            ...state.graph.active,
            transaction,
          },
        },
      });
    }

    case 'SET_ACTIVE_ACCOUNT': {
      let account =
        state.accounts.list.find(
          (d) =>
            d.address === action.payload.address &&
            d.chain === action.payload.chain,
        ) || null;

      if (
        state.graph.active.account?.address === action.payload.address &&
        state.graph.active.account?.chain === action.payload.chain
      ) {
        account = null;
      }

      return stateHook({
        ...state,
        graph: {
          ...state.graph,
          active: {
            ...state.graph.active,
            transaction: null,
            account,
          },
        },
        transactions: {
          ...state.transactions,
          list: {
            ...state.transactions.list,
            filtered: {
              ...state.transactions.list.filtered,
              network: filterListByAccount(
                state.transactions.list.network,
                account,
              ),
            },
          },
        },
      });
    }

    case 'SET_ACTIVE_PLAYLIST': {
      const playlist: TGroup<TPlaylist> | null =
        action.payload.playlist ?? null;

      if (playlist?.id === state.graph.active.playlist.item?.id) {
        return state;
      }

      return stateHook({
        ...state,
        graph: {
          ...state.graph,
          active: {
            ...state.graph.active,
            playlist: {
              ...state.graph.active.playlist,
              item: action.payload.playlist ?? null,
              track: {
                ...state.graph.active.playlist.track,
                active: null,
                list: null,
                completed: null,
              },
            },
          },
        },
      });
    }

    case 'SET_ACTIVE_PLAYLIST_TRACK': {
      let playlist: TTransferTrack | null = action.payload.playlist ?? null;

      if (playlist?.id === state.graph.active.playlist.item?.id) {
        playlist = null;
      }

      return stateHook({
        ...state,
        graph: {
          ...state.graph,
          active: {
            ...state.graph.active,
            playlist: {
              ...state.graph.active.playlist,
              track: {
                active: playlist,
                list: playlist?.steps ?? null,
                completed: null,
              },
            },
          },
        },
      });
    }

    case 'SET_DEPLOYMENT':
      return stateHook({
        ...state,
        deployments: {
          ...state.deployments,
          isDeployed: action.payload,
          playlists: [],
        },
      });

    case 'CHECK_DEPLOYMENT':
      return stateHook({
        ...state,
        deployments: {
          ...state.deployments,
          isDeployed: !!state.transactions.data?.length,
        },
      });

    case 'RESET_PLAYLISTS': {
      const { playlists: data } = action.payload || { playlists: null };
      let list = null;

      if (data) {
        list = getPlaylists(data);
      }

      if (
        !state.graph.active.playlist.item ||
        !state.graph.active.playlist.track.list?.length
      ) {
        const [firstGroup] = list?.groups ?? [];

        return stateHook({
          ...state,
          graph: {
            ...state.graph,
            active: {
              ...state.graph.active,
              playlist: {
                item: firstGroup ?? null,
                track: {
                  ...state.graph.active.playlist.track,
                  list: firstGroup.list ?? null,
                  completed: null,
                },
              },
            },
          },
          playlists: {
            ...state.playlists,
            data,
            list,
          },
        });
      }

      return stateHook({
        ...state,
        playlists: {
          ...state.playlists,
          data,
          list,
        },
      });
    }

    case 'DEPLOYED_PLAYLISTS':
      return stateHook({
        ...state,
        deployments: {
          ...state.deployments,
          playlists: [
            ...new Set([
              ...(state.deployments.playlists || []),
              action.payload.playlistId,
            ]),
          ].filter((d) => d),
        },
      });

    case 'SET_VOLUME':
      return stateHook({
        ...state,
        graph: {
          ...state.graph,
          options: {
            ...state.graph.options,
            volume: action.payload.volume,
          },
        },
      });

    case 'LOADING':
      return stateHook({
        ...state,
        isLoading: action.payload,
      });

    case 'RESET_STATE': {
      return stateHook({
        ...initialState,
      });
    }

    default:
      return stateHook(state);
  }
}

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

export default ContextProvider;
