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
  
  return {
    isLoading,
    data,
  }
};

export default UseTransactions
