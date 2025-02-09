const UseActions = () => {
  const deploy = async () => {
    const response = await fetch("http://localhost:1337/deploy", {
      method: "POST",
    });
    return await response.text();
  };

  const reset = async () => {
    const response = await fetch("http://localhost:1337/deploy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reset: true }),
    });
    return await response.text();
  };

  const playlist = async (list: string) => {
    const response = await fetch("http://localhost:1337/playlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ list }),
    });
    return await response.text();
  };

  return {
    deploy,
    playlist,
    reset,
  };
};

export default UseActions;
