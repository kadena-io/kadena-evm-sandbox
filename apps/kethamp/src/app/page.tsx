"use client";

import React from "react";

import List from "@app/components/panel/body/list/list";
import Panel from "@app/components/panel/panel";

import UseAccounts from "@app/hooks/accounts";
import UseTransactions from "@app/hooks/transactions";
import UseData from "@app/hooks/data";

export default function Main() {
  const [isLoading, setIsLoading] = React.useState(false);
  
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
  const {
    graphData,
  } = UseData({
    accounts: accountsData,
    transactions: transactionsData,
  });

  const maskAccountAddress = (address: string) => {
    if (!address) return "";

    return address.slice(0, 6) + "..." + address.slice(-4);
  }

  React.useEffect(() => {
    console.log('transactions data', transactionsData);
  }, [transactionsData]);

  React.useEffect(() => {
    console.log('listAccounts', listAccounts);
  }, [listAccounts]);

  React.useEffect(() => {
    setIsLoading(isLoadingAccounts || isLoadingTXS);
  }, [isLoadingAccounts, isLoadingTXS]);

  React.useEffect(() => {
    console.log('graphData', graphData);
  }, [graphData]);

  
  return (
    <div className="font-[family-name:var(--font-geist-sans)] py-10">
      {(!accountsData || isLoading) ? <div className="text-white">Loading...</div> : null }
      <main className="w-full m-auto max-w-[640px]">
        <Panel
          type="playback"
          title={"Kadena @ ETH Denver 2025"}
          data={{
            accounts: accountsData,
            transactions: transactionsData,
          }}
        />
        <Panel
          type="list"
          title="Accounts"
          data={[]}
        >
          <List
            data={listAccounts}
            cols={[{ key: "title", style: { flex: 1 } }, { key: "balance", formatter: (value: string) => `${value} KDA` }]}
          />
        </Panel>
        <Panel
          type="list"
          title="Networks"
          data={[]}
        >
          <List
            data={[]}
            hasSearch
            config={{ searchCol: "blockNumber" }}
            cols={[
              { key: "blockNumber", style: { }, formatter: (value: string) => `#${value}` },
              { key: "from", style: { width: '100px' }, formatter: maskAccountAddress },
              { key: "to", style: { width: '100px' }, formatter: maskAccountAddress },
              { key: "", style: { flex: 1 } },
            ]}
          />
        </Panel>
        
        <Panel
          type="list"
          title="Transfers"
          data={[]}
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
  );
}
