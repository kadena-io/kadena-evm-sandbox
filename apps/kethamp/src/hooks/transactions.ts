import React from "react";
import useSWR from "swr";

const UseTransactions = () => {
  const { data, isLoading } = useSWR(
    "/",
    async () => {
      const response = await fetch("http://localhost:1337/txs");
      return await response.json();
    },
    { refreshInterval: 1000 }
  );
  
  const [list, setList] = React.useState<any[]>([]);
  const [time, setTime] = React.useState(0);
  const [minBlockNumber, setMinBlockNumber] = React.useState(0);
  const [lastBlockNumber, setLastBlockNumber] = React.useState(0);
  
  const forwards = React.useCallback(() => {
    setTime((t) => t + 1);
  }, [setTime]);
  const backwards = React.useCallback(() => {
    setTime((t) => t - 1);
  }, [setTime]);

  React.useEffect(() => {
    if (!isLoading && data?.length) {
      const [firstTx] = data;
      const minBlockNumber = firstTx.blockNumber;
      const lastBlockNumber = data[data.length - 1].blockNumber;
      
      setMinBlockNumber(minBlockNumber);
      setLastBlockNumber(lastBlockNumber);

      const duration = lastBlockNumber - minBlockNumber;
      const maxDisplayedTxBlock = time * 0.01 * duration;
    
      const displayedTxs = data.filter(
        (tx: any) => tx.blockNumber > lastBlockNumber - maxDisplayedTxBlock
      );
      const chain0Txs = displayedTxs.filter(
        (tx: any) => tx.network === "kadena_devnet1"
      );
      const chain1Txs = displayedTxs.filter(
        (tx: any) => tx.network === "kadena_devnet2"
      );

      setList([
        {
          title: 'Kadena Devnet 1',
          list: chain0Txs,
        },
        {
          title: 'Kadena Devnet 2',
          list: chain1Txs,
        }
      ]);
    }
  }, [data, isLoading, time, setList, setMinBlockNumber, setLastBlockNumber]);

  React.useEffect(() => {
    console.log('list', list);
  }, [list]);

  return {
    isLoading,
    data,
    list,

    playback: {
      time,
      forwards,
      backwards,
    },

    blockInfo: {
      minBlockNumber,
      lastBlockNumber,
    }
  }
};

export default UseTransactions
