import React from "react";

import MainComponent from "@app/components/main/main";
import ContextProvider from "@app/context/context";

export default function Main() {
  return (
    <ContextProvider>
      <MainComponent />
    </ContextProvider>
  );
}
