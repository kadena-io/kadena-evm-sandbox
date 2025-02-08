import React from "react";
import useSWR from "swr";

export type TAccount = {
  address: string;
  balance: string;
}

type TChainRef = `chain${number}`
type TAccountId = string

export type TAccounts = {
  [key: TChainRef]: {
    [key: TAccountId]: TAccount;
  }
}

const UseAccounts = () => {
  const [list, setList] = React.useState<any[]>([]);

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
      setList(Object.keys(data).map((chainRef) => {
        return {
          title: chainRef,
          list: Object.keys(data[chainRef]).map((accountId) => {
            return {
              title: accountId,
              balance: data[chainRef][accountId].balance,
            }
          })
        }
      }));
    }
  }, [data]);
  
  return {
    data,
    list,
    isLoading,
  }
};

export default UseAccounts;
