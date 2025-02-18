"use client";

import React from "react";

import MainComponent from "@app/components/main/main";
import ContextProvider from "@app/context/context";

export default function Main() {
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <ContextProvider>
      <MainComponent />
    </ContextProvider>
  );
}
