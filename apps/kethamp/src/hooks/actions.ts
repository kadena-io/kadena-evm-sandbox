const UseActions = () => {
  const deploy = async () => {
    const response = await fetch("http://localhost:1337/deploy", {
      method: "POST",
    });
    await response.text();
    return await playlist();
  };
  
  const reset = async () => {
    const response = await fetch("http://localhost:1337/deploy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true }),
    });
    return await response.text();
  };

  const playlist = async () => {
    const response = await fetch("http://localhost:1337/playlist", {
      method: "POST",
    });
    return await response.text();
  };

  return {
    deploy,
    playlist,
    reset,
  }
}

export default UseActions;
