"use client";

import useSWR from "swr";
const Txs = ({ title, txs }: { title: string; txs: any[] }) => {
  return (
    <div className="flex flex-col border p-4">
      <h2>{title}</h2>
      <div className="flex flex-col">
        {txs.flatMap((tx: any) => (
          <div className="flex flex-col border p-4" key={tx.hash}>
            <div>{tx.blockNumber}</div>
            {tx.logs.map((log: any) => (
              <div className="flex flex-col" key={log.event}>
                <div>{log.event}</div>
                <div>{log.args.join(", ")}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Transactions = () => {
  const { data, isLoading } = useSWR(
    "/",
    async () => {
      const response = await fetch("http://localhost:1337/txs");
      return await response.json();
    },
    { refreshInterval: 1000 }
  );
  if (isLoading) return <div>Loading...</div>;
  const chain0Txs = data.filter((tx: any) => tx.network === "kadena_devnet1");
  const chain1Txs = data.filter((tx: any) => tx.network === "kadena_devnet2");
  return (
    <div className="grid grid-cols-2">
      <Txs title="Chain 0" txs={chain0Txs} />
      <Txs title="Chain 1" txs={chain1Txs} />
    </div>
  );
};
