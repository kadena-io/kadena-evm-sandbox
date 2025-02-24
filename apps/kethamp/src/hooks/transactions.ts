import { useContext } from '@app/context/context';
import useSWR from 'swr';
import UseActions from './actions';

const UseTransactions = () => {
  const state = useContext();
  const {
    playlist: { get: getPlaylists },
  } = UseActions();
  const { data, isLoading } = useSWR(
    '/',
    async () => {
      const response = await fetch('http://localhost:1337/txs');

      if (
        state?.deployments.isDeployed &&
        !Object.keys(state?.playlists.data ?? {}).length
      ) {
        await getPlaylists();
      }

      return await response.json();
    },
    { refreshInterval: 1000 },
  );

  return {
    isLoading,
    data,
  };
};

export default UseTransactions;
