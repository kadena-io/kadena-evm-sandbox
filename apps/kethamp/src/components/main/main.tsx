"use client"

import React from 'react';

import List from "@app/components/panel/body/list/list";
import Panel from "@app/components/panel/panel";

import UseAccounts from "@app/hooks/accounts";
import UseTransactions from "@app/hooks/transactions";

import { useContext, useContextDispatch } from '../../context/context';

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
    console.log('state', state);
  }, [state]);

  return <div className="font-[family-name:var(--font-geist-sans)] py-10">
    <main className="w-full m-auto max-w-[640px]">
      <Panel
        type="playback"
        title={"Kadena @ ETH Denver 2025"}
      />
      <Panel
        type="list"
        title="Accounts"
      >
        <List
          data={listAccounts}
          cols={[{ key: "title", style: { flex: 1 } }, { key: "balance", formatter: (value: string) => `${value} KDA` }]}
        />
      </Panel>
      <Panel
        type="list"
        title="Networks"
      >
        {
          state?.transactions?.list?.network ? (
            <List
              data={state.transactions.list.network}
              hasSearch
              config={{ searchCol: "blockNumber" }}
              cols={[
                { key: "blockNumber", style: { }, formatter: (value: string) => `#${value}` },
                { key: "title", style: { }},
                // { key: "from", style: { width: '100px' }, formatter: maskAccountAddress },
                // { key: "to", style: { width: '100px' }, formatter: maskAccountAddress },
                { key: "", style: { flex: 1 } },
              ]}
            />
          ) : null
        }
      </Panel>
      
      <Panel
        type="list"
        title="Transfers"
      >
        <List
          hasSearch
          data={[
            {
              title: "Chain 1",
              list: Array.from({length: 20}).map((_, i) => ({ title: "Apollo Omega Point " + i, i: i+1})),
            },
            {
              title: "Chain 2",
              list: Array.from({length: 20}).map((_, i) => ({ title: "Apollo Omega Point", i: i+1})),
            },
          ]}
          cols={[{ key: "title", style: { flex: 1 } }]}
        />
      </Panel>
    </main>
  </div>
}

export default Main;
