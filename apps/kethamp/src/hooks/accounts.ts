import React from "react";
import useSWR from "swr";
import { TList } from "@app/context/context.type";

type TChainRef = `chain${number}`
type TAccountId = string

export type TAccount = {
  address: string;
  balance: string;
  chain: TChainRef;
  accountLabel: string;
}

export type TAccounts = {
  [key: TChainRef]: {
    [key: TAccountId]: TAccount;
  }
}

const UseAccounts = () => {
  const [list, setList] = React.useState<TList<TAccount>[]>([]);

  const { data, isLoading } = useSWR<TAccounts>(
    "/accounts",
    async () => {
      const response = await fetch("http://localhost:1337/accounts");
      return await response.json();
    },
    { refreshInterval: 1000 }
  );

  React.useEffect(() => {
    if (data) {
      setList(Object.entries(data).map(([chainRef, accounts]) => ({
        title: chainRef,
        list: Object.entries(accounts).map(([accountId, accountData]) => ({
          ...accountData,
          chain: chainRef as TChainRef,
          accountLabel: accountId,
        }))
      })));
    }
  }, [data]);
  
  return {
    data,
    list,
    isLoading,
  }
};

export default UseAccounts;
