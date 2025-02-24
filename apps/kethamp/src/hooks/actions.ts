import { useContext, useContextDispatch } from '@app/context/context';
import type { TContext } from '@app/context/context.type';

const UseActions = () => {
  const state = useContext();
  const dispatch = useContextDispatch();

  const deploy = async () => {
    dispatch({
      type: 'RESET_STATE',
    });

    const response = await fetch('http://localhost:1337/deploy', {
      method: 'POST',
    });

    await response.text();

    dispatch({
      type: 'SET_DEPLOYMENT',
      payload: true,
    });

    if (state?.graph?.active?.playlist?.item?.id) {
      await runPlaylist();

      dispatch({
        type: 'DEPLOYED_PLAYLISTS',
        payload: {
          playlistId: state.graph.active.playlist.item.id,
        },
      });
    }

    return 'Deployed';
  };

  const reset = async () => {
    dispatch({
      type: 'RESET_STATE',
    });

    const response = await fetch('http://localhost:1337/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reset: true }),
    });

    await response.text();

    dispatch({
      type: 'SET_DEPLOYMENT',
      payload: true,
    });

    return 'Reset';
  };

  const runPlaylist = async () => {
    const list = state?.graph?.active?.playlist?.item?.id;

    if (!list) {
      alert('No playlist selected');
    }

    const response = await fetch('http://localhost:1337/playlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ list }),
    });
    await response.text();

    if (state?.graph?.active?.playlist?.item?.id) {
      dispatch({
        type: 'DEPLOYED_PLAYLISTS',
        payload: {
          playlistId: state?.graph?.active.playlist.item.id,
        },
      });
    }

    return 'Playlist';
  };

  const getPlaylists = async () => {
    const response = await fetch('http://localhost:1337/playlist', {
      method: 'GET',
    });

    const data: TContext['playlists']['data'] = await response.json();

    const playlists: TContext['playlists']['data'] = data
      ? Object.keys(data).reduce((acc, key: string) => {
          return {
            ...acc,
            [key]: {
              id: key,
              title: `Playlist ${key}`,
              tracks: data[key],
            },
          };
        }, {})
      : null;

    if (playlists) {
      dispatch({
        type: 'RESET_PLAYLISTS',
        payload: {
          playlists,
        },
      });
    }
  };

  return {
    deploy,
    playlist: {
      run: runPlaylist,
      get: getPlaylists,
    },
    reset,
  };
};

export default UseActions;
