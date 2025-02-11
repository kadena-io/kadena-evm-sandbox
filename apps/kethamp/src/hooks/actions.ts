import { useContext, useContextDispatch } from "@app/context/context";

const UseActions = () => {
  const state = useContext();
  const dispatch = useContextDispatch();

  const deploy = async () => {
    dispatch({
      type: "RESET_STATE",
    });
    
    
    const response = await fetch("http://localhost:1337/deploy", {
      method: "POST",
    });
    
    await response.text();
    
    dispatch({
      type: "SET_DEPLOYMENT",
      payload: true,
    });
    
    if (state?.graph?.active?.playlist?.id) {
      await playlist();

      dispatch({
        type: "DEPLOYED_PLAYLISTS",
        payload: {
          playlist: state.graph.active.playlist.id
        },
      });
    }

    return "Deployed";
  };

  const reset = async () => {
    dispatch({
      type: "RESET_STATE",
    });

    const response = await fetch("http://localhost:1337/deploy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true }),
    });
    
    await response.text();

    dispatch({
      type: "SET_DEPLOYMENT",
      payload: true,
    });

    return "Reset";
  };

  const playlist = async () => {
    const list = state?.graph?.active?.playlist?.id

    if (!list) {
      alert("No playlist selected");
    }

    const response = await fetch("http://localhost:1337/playlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ list }),
    });
    await response.text();

    if (state?.graph?.active?.playlist?.id) {
      dispatch({
        type: "DEPLOYED_PLAYLISTS",
        payload: {
          playlist: state?.graph?.active.playlist.id,
        },
      });
    }
    
    return "Playlist";
  };

  return {
    deploy,
    playlist,
    reset,
  };
};

export default UseActions;
