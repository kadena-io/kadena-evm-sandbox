"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";
const Log = ({ log }: { log: any }) => {
  if (log.event.startsWith("Transfer"))
    return (
      <div className="flex flex-col border p-4">
        <div>{log.event}</div>
        <div>
          {log.args[0]} {"->"} {log.args[1]}: {log.args[2]}
        </div>
      </div>
    );
  return (
    <div className="flex flex-col border p-4">
      <div>{log.event}</div>
      <div>{log.args.join(", ")}</div>
    </div>
  );
};
const Txs = ({ title, txs }: { title: string; txs: any[] }) => {
  return (
    <div className="flex flex-col border p-4">
      <h2>{title}</h2>
      <div className="flex flex-col">
        {txs.flatMap((tx: any) => (
          <div className="flex flex-col border p-4" key={tx.hash}>
            <div>{tx.blockNumber}</div>
            {!tx.logs.length && (
              <div>No Events available for this transaction</div>
            )}
            {tx.logs.map((log: any) => (
              <Log log={log} key={tx.hash + log.args.join(",")} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const Transactions = () => {
  const [playTime, setPlayTime] = useState(0);
  const forward = useCallback(() => setPlayTime((t) => t + 1), []);
  const backwards = useCallback(() => setPlayTime((t) => t - 1), []);
  const { data, isLoading } = useSWR(
    "/",
    async () => {
      const response = await fetch("http://localhost:1337/txs");
      return await response.json();
    },
    { refreshInterval: 1000 }
  );
  if (!data?.length || isLoading) return <div>Loading...</div>;
  const [firstTx] = data;
  const minBlockNumber = firstTx.blockNumber;
  const lastBlockNumber = data[data.length - 1].blockNumber;
  const duration = lastBlockNumber - minBlockNumber;

  const maxDisplayedTxBlock = playTime * 0.01 * duration;

  const displayedTxs = data.filter(
    (tx: any) => tx.blockNumber > lastBlockNumber - maxDisplayedTxBlock
  );
  const chain0Txs = displayedTxs.filter(
    (tx: any) => tx.network === "kadena_devnet1"
  );
  const chain1Txs = displayedTxs.filter(
    (tx: any) => tx.network === "kadena_devnet2"
  );
  return (
    <div>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={backwards}
      >
        {"<"}
      </button>
      <button
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onClick={forward}
      >
        {">"}
      </button>
      <div className="grid grid-cols-2">
        <Txs title="Chain 0" txs={chain0Txs} />
        <Txs title="Chain 1" txs={chain1Txs} />
      </div>
    </div>
  );
};
