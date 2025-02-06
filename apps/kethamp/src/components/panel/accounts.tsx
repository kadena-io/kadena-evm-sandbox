"use client";

import useSWR from "swr";

export const Accounts = () => {
  const { data, isLoading } = useSWR(
    "/accounts",
    async () => {
      const response = await fetch("http://localhost:1337/accounts");
      return await response.json();
    },
    { refreshInterval: 1000 }
  );
  if (!data || isLoading) return <div>Loading...</div>;
  const { chain0, chain1 } = data;
  return (
    <div className="grid grid-cols-2">
      <div className="border p-4">
        <h2>Chain 0</h2>
        <div className="grid grid-cols-2">
          <div>Address</div>
          <div>Balance</div>
          <div>{chain0.alice.address}</div>
          <div>{chain0.alice.balance}</div>
          <div>{chain0.bob.address}</div>
          <div>{chain0.bob.balance}</div>
        </div>
      </div>
      <div className="border p-4">
        <h2>Chain 1</h2>
        <div className="grid grid-cols-2">
          <div>Address</div>
          <div>Balance</div>
          <div>{chain1.alice.address}</div>
          <div>{chain1.alice.balance}</div>
          <div>{chain1.bob.address}</div>
          <div>{chain1.bob.balance}</div>
        </div>
      </div>
    </div>
  );
};
