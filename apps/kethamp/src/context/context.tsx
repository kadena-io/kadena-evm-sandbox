'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import useLocalStorage from '@app/hooks/localStorage';
import {
  filterListByAccount,
  getAccountsList,
  getActivePlaylistByTrackId,
  getPlaylists,
  getTracksByProgressTxs,
  getTransactionsList,
  getTransactionsListByNetwork,
  groupTransactions,
  maxSize,
  networks,
  stateHook,
} from '@app/utils';
import React from 'react';
import type {
  TContext,
  TGroup,
  TPlaylist,
  TTransferTrack,
} from './context.type';
import { initialState } from './data';

const Context = React.createContext<TContext | null>(null);
const ContextDispatch = React.createContext(null) as unknown as React.Context<
  React.Dispatch<{ payload?: any; type: string }>
>;

export const localStorageKey = 'kethamp';

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
          active: {
            ...state.graph.active,
            transaction: null,
            tracks: getTracksByProgressTxs(next, nextState),
            playlist: {
              ...state.graph.active.playlist,
              item:
                getActivePlaylistByTrackId(next, nextState) ??
                state.graph.active.playlist.item,
            },
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

export default ContextProvider;
