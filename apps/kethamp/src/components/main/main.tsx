'use client';

import React from 'react';

import List from '@app/components/panel/body/list/list';
import Panel from '@app/components/panel/panel';

import UseAccounts from '@app/hooks/accounts';
import UseTransactions from '@app/hooks/transactions';

import { useContext, useContextDispatch } from '@app/context/context';
import type {
  TContext,
  TPlaylist,
  TTransaction,
  TTransferTrack,
} from '@app/context/context.type';
import styles from './main.module.css';

const Main = () => {
  const state = useContext();
  const dispatch = useContextDispatch();
  const {
    data: accountsData,
    list: listAccounts,
    isLoading: isLoadingAccounts,
  } = UseAccounts();
  const { data: transactionsData, isLoading: isLoadingTXS } = UseTransactions();

  React.useEffect(() => {
    dispatch({
      type: 'LOADING',
      payload: isLoadingAccounts || isLoadingTXS,
    });
  }, [dispatch, isLoadingAccounts, isLoadingTXS]);

  React.useEffect(() => {
    if (accountsData && transactionsData && dispatch) {
      dispatch({
        type: 'UPDATE_DATA',
        payload: {
          accounts: accountsData,
          transactions: transactionsData,
        },
      });
      dispatch({
        type: 'CHECK_DEPLOYMENT',
      });
    }
  }, [accountsData, dispatch, transactionsData]);

  return (
    <div className="font-[family-name:var(--font-geist-sans)] py-10">
      <main className={[styles.main].join(' ')}>
        <div className={styles.mainCol}>
          <Panel type="playback" title={'Kadena @ ETH Denver 2025'} />
          {listAccounts?.length ? (
            <Panel type="list" title="Playlists">
              <List
                sidebar={true}
                hasSearch
                groupedData={{
                  title: `${state?.graph?.active?.playlist?.item?.title} -> Transactions steps`,
                  groups: state?.playlists?.list?.groups ?? null,
                }}
                cols={[
                  { key: 'id' },
                  // { key: "type" },
                  { key: 'title', style: { flex: 1 } },
                ]}
                groupConfig={{
                  onClick: (item: TPlaylist) =>
                    dispatch({
                      type: 'SET_ACTIVE_PLAYLIST',
                      payload: {
                        playlist: item,
                      },
                    }),
                }}
                config={{
                  entity: 'playlist.track.active',
                  list: state?.graph?.active?.playlist?.item?.list || null,
                  entityKeys: ['id'],
                  searchCols: ['title', 'id'],
                  onClick: (item: TTransferTrack) =>
                    dispatch({
                      type: 'SET_ACTIVE_PLAYLIST_TRACK',
                      payload: {
                        playlist: item,
                      },
                    }),
                }}
              />
            </Panel>
          ) : null}
          {state?.deployments.isDeployed &&
          state?.graph.active?.playlist?.track.list?.length ? (
            <Panel type="list" title="Tracks">
              <List
                data={[
                  {
                    title: `Track records for playlist "${state.graph.active.playlist.track.active?.title}"`,
                    list: state.graph.active.playlist.track.list || [],
                  },
                ]}
                cols={[{ key: 'title', style: { flex: 1 } }, { key: 'id' }]}
                config={{
                  entity: 'tracks',
                  operator: 'contains',
                  activeType: 'highlight',
                  entityKeys: ['id'],
                }}
              />
            </Panel>
          ) : null}
        </div>
        <div className={styles.mainCol}>
          {listAccounts?.length ? (
            <Panel type="list" title="Accounts">
              <List
                data={listAccounts}
                cols={[
                  { key: 'accountLabel', style: { flex: 1 } },
                  {
                    key: 'balance',
                    formatter: (value: string) => `${value} $KDA`,
                  },
                ]}
                config={{
                  entity: 'account',
                  entityKeys: ['address', 'chain'],
                  onClick: (item: TContext['accounts']['list'][0]) =>
                    dispatch({
                      type: 'SET_ACTIVE_ACCOUNT',
                      payload: {
                        address: item.address,
                        chain: item.chain,
                      },
                    }),
                }}
              />
            </Panel>
          ) : null}
          {state?.deployments.isDeployed && (
            <Panel type="list" title="Network Transactions">
              {state?.transactions?.list?.network ? (
                <List
                  data={
                    (state.graph.active.account &&
                      state.transactions.list?.filtered?.network) ||
                    state.transactions.list.network
                  }
                  hasSearch
                  config={{
                    searchCols: ['title'],
                    entity: 'transaction',
                    entityKeys: ['hash'],
                    onClick: (item: TTransaction) =>
                      dispatch({
                        type: 'SET_ACTIVE_TRANSACTION',
                        payload: {
                          hash: item.hash,
                        },
                      }),
                  }}
                  cols={[
                    {
                      key: 'blockNumber',
                      style: {
                        width: '50px',
                        maxWidth: '50px',
                        minWidth: '50px',
                      },
                      formatter: (value: string) => `#${value}`,
                    },
                    { key: 'title', style: {} },
                    // { key: "from", style: { width: '100px' }, formatter: maskAccountAddress },
                    // { key: "to", style: { width: '100px' }, formatter: maskAccountAddress },
                    // { key: "", style: { flex: 1 } },
                  ]}
                />
              ) : null}
            </Panel>
          )}
          {state?.deployments.isDeployed && state?.graph.active.transaction ? (
            <Panel type="list" title="Transaction Details">
              <List
                hasSearch
                config={{
                  searchCols: ['value'],
                }}
                data={[
                  {
                    title: state.graph.active.transaction.title,
                    list:
                      state.graph.active?.transaction &&
                      Object.entries(state.graph.active.transaction || {})
                        .map(([key, value]) => ({
                          title: key,
                          value:
                            typeof value === 'string'
                              ? value
                              : JSON.stringify(value),
                        }))
                        .sort((a, b) => a.title.localeCompare(b.title)),
                  },
                ]}
                cols={[
                  { key: 'title', style: { maxWidth: '200px', width: '100%' } },
                  {
                    key: 'value',
                    style: {},
                    formatter: (value: string) => value ?? '-',
                  },
                ]}
              />
            </Panel>
          ) : null}
          {state?.graph.active.transaction?.logs?.length ? (
            <Panel type="list" title="Transaction Logs">
              <List
                hasSearch
                config={{
                  searchCols: ['value'],
                  customCount: state.graph.active?.transaction.logs.length,
                }}
                data={[
                  {
                    title: state.graph.active.transaction.title,
                    list: (state.graph.active?.transaction.logs || []).flatMap(
                      (log, index) => {
                        const entries = Object.entries(log).map(
                          ([key, value]) => ({
                            title: `${key} [${index}]`,
                            value: value,
                          }),
                        );

                        return [{ title: '---', value: '---' }, ...entries];
                      },
                    ),
                  },
                ]}
                cols={[
                  { key: 'title', style: { maxWidth: '80px', width: '100%' } },
                  { key: 'value', style: {} },
                ]}
              />
            </Panel>
          ) : null}
        </div>
      </main>
    </div>
  );
};

export default Main;
