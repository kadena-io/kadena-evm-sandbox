import React from "react";
import PlaybackContext from "@app/context/playback";

const UsePlayback = () => {

  const { state, dispatch } = React.useContext(PlaybackContext);

  const play = () => {
    dispatch({ type: "PLAY" });
  };

  const pause = () => {
    dispatch({ type: "PAUSE" });
  };

  return {
    play,
    pause
  };
}

export default UsePlayback;
