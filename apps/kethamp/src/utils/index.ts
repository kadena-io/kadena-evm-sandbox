/* eslint-disable @typescript-eslint/no-explicit-any */

import { localStorageKey } from "../context/context";

import type {
  TAccount,
  TAsideList,
  TContext,
  TList,
  TPlaylist,
  TTransaction,
} from '../context/context.type';

export const maskAccountAddress = (address: string) => {
  if (!address) return '';

  return address.slice(0, 6) + '...' + address.slice(-4);
};

export const throttle = (callback: (...args: any) => any, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (...args: any[]) {
    if (timeoutId === null) {
      callback(...args);
      timeoutId = setTimeout(() => {
        timeoutId = null;
      }, delay);
    }
  };
};

export function stateHook(state: TContext) {
  localStorage?.setItem(localStorageKey, JSON.stringify(state));

  return state;
}

export function groupByStep(list: TGroupTransactions | undefined, step: number) {
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
export function groupTransactions(
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

export function networks(transactions: TContext['transactions']['data']): string[] {
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

export function maxSize(data: TGroupTransactions | undefined): number {
  if (!data) return 0;

  return Math.max(0, ...Object.values(data).map((arr) => arr.length));
}

export function getTransactionsList(
  state: TContext,
  graphData?: TContext['graph']['data'] | null,
): TTransaction[] {
  const { progress } = state.graph.options;

  if (graphData) {
    return graphData[progress] ?? [];
  }

  return state.graph.data?.[progress] ?? [];
}

export function getTransactionsListByNetwork(
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

export function getAccountsList(
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

export function filterListByAccount(
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

export function getPlaylists(
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

export function getTracksByProgressTxs(
  progress: number,
  state: TContext,
): TTransaction['trackId'][] | null {
  const transactions = state?.graph.data?.[progress] ?? [];
  const list = transactions
    .map((d) => d.trackId as string);

  if (list.length > 0) {
    return [...new Set(list)];
  }

  return null;
}

export function getActivePlaylistByTrackId(
  progress: number,
  state: TContext,
) {
  const activeIds = getTracksByProgressTxs(progress, state);
  
  return state?.playlists.list?.groups?.find((group) => {
    return group.list?.some(({ id }) => activeIds?.includes(id));
  })
}
