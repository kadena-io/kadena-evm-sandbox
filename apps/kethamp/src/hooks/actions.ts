const UseActions = () => {
  const deploy = async () => {
    const response = await fetch("http://localhost:1337/deploy", {
      method: "POST",
    });
    return await response.text();
  };

  const play = async () => {
    const response = await fetch("http://localhost:1337/playlist", {
      method: "POST",
    });
    return await response.text();
  };

  return {
    deploy,
    play,
  }
}

export default UseActions;
