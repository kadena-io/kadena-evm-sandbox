import React from "react";

const stepSize = 10;

const UseData = ({ data }) => {
  const [graphData, setGraphData] = React.useState<Record<string, any[]>>({});
  const [networks, setNetworks] = React.useState<string[]>([]);
  const [maxStepCount, setMaxStepCount] = React.useState<number>(0);

  const groupByStep = React.useCallback((list: Record<string, any>, step: number): Record<string, any[]> => {
    const grouped: Record<string, any[]> = {};
    const keys = Object.keys(list).map(parseFloat);

    const minKey = Math.floor(Math.min(...keys) / step) * step;
    const maxKey = Math.ceil(Math.max(...keys) / step) * step;

    for (let i = minKey; i <= maxKey; i += step) {
      grouped[i] = [];
    }

    keys.forEach(key => {
      const groupKey = Math.floor(key / step) * step;
      grouped[groupKey]?.push(...list[key.toString()]);
    });

    return grouped;
  }, []);

  React.useEffect(() => {
    let maxSize = 0;

    Object.values(graphData).forEach(arr => {
      if (arr.length > maxSize) {
        maxSize = arr.length;
      }
    });

    setMaxStepCount(maxSize);
  }, [graphData]);

  React.useEffect(() => {
    if (data?.transactions) {
      const minBlockNumber = data.transactions.reduce((acc, d) => Math.min(acc, d.blockNumber), Infinity);
      const lastBlockNumber = data.transactions.reduce((acc, d) => Math.max(acc, d.blockNumber), 0);
      const duration = lastBlockNumber - minBlockNumber;
      const steps = 100 / duration;

      setNetworks(data.transactions.reduce((acc, d) => {
        if (!acc.includes(d.network)) {
          return [...acc, d.network];
        }

        return acc;
      }, []));

      const transactionsByPercentage = data.transactions.reduce((acc, d) => {
        const percentage = ((d.blockNumber - minBlockNumber) / duration) * 100;
        const step = Math.floor(percentage * steps);
        
        return {
          ...acc,
          [percentage]: acc[step] ? [...acc[step], d] : [d],
        }
      }, {});

      const groupedTransactions = groupByStep(transactionsByPercentage, stepSize);
      
      console.log({
        minBlockNumber,
        lastBlockNumber,
        duration,
        steps,
        transactionsByPercentage,
        groupedTransactions,
      })
      
      setGraphData(groupedTransactions);
    }
  }, [data, groupByStep, setGraphData]);


  return {
    graphData,
    networks,
    options: {
      stepSize,
      maxStepCount,
    },
  }
}

export default UseData;
