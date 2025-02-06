"use client";

export const Play = () => {
  const play = async () => {
    const response = await fetch("http://localhost:1337/playlist", {
      method: "POST",
    });
    return await response.text();
  };
  return (
    <button
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      onClick={play}
    >
      Play
    </button>
  );
};
