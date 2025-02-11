"use client"

import React from 'react';

import List from "@app/components/panel/body/list/list";
import Panel from "@app/components/panel/panel";

import UseAccounts from "@app/hooks/accounts";
import UseTransactions from "@app/hooks/transactions";

import { useContext, useContextDispatch } from '../../context/context';
import styles from './main.module.css';

const Main = () => {
  const state = useContext();
  const dispatch = useContextDispatch();
  const {
      data: accountsData,
      list: listAccounts,
      isLoading: isLoadingAccounts
    } = UseAccounts();
    const { 
      data: transactionsData,
      // list: listTransactions,
      isLoading: isLoadingTXS,
    } = UseTransactions();

  const maskAccountAddress = (address: string) => {
    if (!address) return "";

    return address.slice(0, 6) + "..." + address.slice(-4);
  }
  
  React.useEffect(() => {
    dispatch({
      type: "LOADING",
      payload: isLoadingAccounts || isLoadingTXS,
    });
  }, [dispatch, isLoadingAccounts, isLoadingTXS]);

  React.useEffect(() => {
    if (accountsData && transactionsData && dispatch) {
      dispatch({
        type: "UPDATE_DATA",
        payload: {
          accounts: accountsData,
          transactions: transactionsData,
        },
      });
    }
  }, [accountsData, dispatch, transactionsData]);

  React.useEffect(() => {
    console.log("App state", {state})
  }, [state]);

  return <div className="font-[family-name:var(--font-geist-sans)] py-10">
    <main className={[styles.main, "w-full m-auto max-w-[640px]"].join(" ")}>
      <Panel
        type="playback"
        title={"Kadena @ ETH Denver 2025"}
      />
      {listAccounts?.length ? <Panel
        type="list"
        title="Playlists"
      >
        <List
          data={[{title: 'Available deployment playlists', list: state.playlists.data}]}
          cols={[
            { key: "title", style: { flex: 1 } },
            { key: "id" }
          ]}
          config={{
            entity: "playlist",
            entityKey: "id",
            onClick: (item) => dispatch({
              type: "SET_ACTIVE_PLAYLIST",
              payload: {
                playlistId: item.id,
              },
            })
          }}
        />
      </Panel> : null}
      {listAccounts?.length ? <Panel
        type="list"
        title="Accounts"
      >
        <List
          data={listAccounts}
          cols={[
            { key: "title", style: { flex: 1 } },
            { key: "balance", formatter: (value: string) => `${value} KDA` }
          ]}
          config={{
            entity: "account",
            entityKey: ["address", "chain"],
            onClick: (item) => dispatch({
              type: "SET_ACTIVE_ACCOUNT",
              payload: {
                address: item.address,
                chain: item.chain,
              },
            })
          }}
        />
      </Panel> : null}
      {state.deployments.isDeployed && state?.transactions?.list?.network?.length ? <Panel
        type="list"
        title="Network Transactions"
      >
        {
          state?.transactions?.list?.network ? (
            <List
              data={(state.graph.active.account && state.transactions.list?.filtered?.network) || state.transactions.list.network}
              hasSearch
              config={{
                searchCol: "title",
                entity: "transaction",
                entityKey: "hash",
                onClick: (item) => dispatch({
                  type: "SET_ACTIVE_TRANSACTION",
                  payload: {
                    hash: item.hash,
                  },
                })
              }}
              cols={[
                { key: "blockNumber", style: { }, formatter: (value: string) => `#${value}` },
                { key: "title", style: { maxWidth: '200px' } },
                // { key: "from", style: { width: '100px' }, formatter: maskAccountAddress },
                // { key: "to", style: { width: '100px' }, formatter: maskAccountAddress },
                // { key: "", style: { flex: 1 } },
              ]}
            />
          ) : null
        }
      </Panel> : null}
      {state.deployments.isDeployed && state.graph.active.transaction ? (
          <Panel
            type="list"
            title="Transaction Details"
          >
            <List
              hasSearch
              config={{
                searchCol: "value",
              }}
              data={[
                {
                  title: state.graph.active.transaction.title,
                  list: state.graph.active?.transaction && Object.keys(state.graph.active.transaction).reduce((res, key) => {
                    const value = state.graph.active.transaction?.[key]
                    return [
                      ...res,
                      {
                        title: key,
                        value: (typeof value === "string") ? value : JSON.stringify(value),
                      }
                    ]
                  }, []).sort((a, b) => a.title.localeCompare(b.title))
                }
              ]}
              cols={[
                { key: "title", style: { maxWidth: '200px', width: '100%' } },
                { key: "value", style: { }, formatter: (value: string) => value ?? "-" },
              ]}
            />
          </Panel>
        ) : null
        }
        { state.graph.active.transaction?.logs?.length ? (
            <Panel
              type="list"
              title="Transaction Logs"
            >
              <List
                hasSearch
                config={{
                  searchCol: "value",
                  customCount: state.graph.active?.transaction.logs.length,
                }}
                data={[
                  {
                    title: state.graph.active.transaction.title,
                    list: state.graph.active?.transaction.logs.reduce((res, value, index) => {
                      return [
                        ...res,
                        {
                          title: `---`,
                          value: "---",
                        },
                        ...Object.keys(value).reduce((acc, key) => { 
                          return [
                            ...acc,
                            {
                              title: `${key} [${index}]`,
                              value: value[key]
                            }
                          ]
                        }, []),
                      ]
                    }, [])/* .sort((a, b) => a.value.localeCompare(b.value)) */
                  }
                ]}
                cols={[
                  { key: "title", style: { maxWidth: '80px', width: '100%' } },
                  { key: "value", style: { } },
                ]}
              />
            </Panel>
          ) : null
      }
    </main>
  </div>
}

export default Main;
