"use client";

import Header from "@app/components/panel/header/header";
import type { HeaderProps } from "@app/components/panel/header/header";
import Playback from "@app/components/panel/body/playback/playback";
import React from "react";
import Layout from "./body/layout/layout";

export type PanelTypes = "playback" | "list";

export type PanelProps = {
  children?: React.ReactNode;
  type: PanelTypes;
  data: ListItem[];
  handlers?: {
    [key: string]: () => void;
  };
} &
  HeaderProps;

export type ListItem = {
  readonly from: string;
  readonly to: string;
  readonly gasPrice: string;
  readonly network: string;
  readonly events: EventProps[];
  readonly blockHeight: number;
}

export type EventProps = {
  readonly name: string;
  readonly data: string;
}

export const Panel: React.FC<PanelProps> = ({ type, title, data, handlers={}, children }) => {
  return (
    <div>
      <Header title={title} type={type} />
      {
        type === "playback" ? 
        <Playback
          data={data}
          handlers={handlers}
        /> :
        type === "list" ?
        <Layout>{children}</Layout> : null
      }
    </div>
  )
}

export default Panel;
