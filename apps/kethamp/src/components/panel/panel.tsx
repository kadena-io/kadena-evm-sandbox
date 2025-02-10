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

export const Panel: React.FC<PanelProps> = ({ type, title, children }) => {
  return (
    <div>
      <Header title={title} type={type} />
      {type === "playback" && <Playback />}
      {type === "list" && <Layout>{children}</Layout>}
    </div>
  )
}

export default Panel;
