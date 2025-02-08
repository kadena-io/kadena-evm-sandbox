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

export const Panel: React.FC<PanelProps> = ({ type, title, data, handlers, children }) => {
  const [progress, setProgress] = React.useState(0);
  const [list, setList] = React.useState<ListItem[]>(data);
  const [activeItem, setActiveItem] = React.useState<ListItem | null>(null);

  React.useEffect(() => {
    setList(data.map((item, index) => ({ ...item, index: Math.ceil(index * 100 / data.length) })));
    setActiveItem(data[0]);
  }, [data, list.length]);

  React.useEffect(() => {
    setActiveItem(data[progress]);
  }, [data, progress]);

  React.useEffect(() => {
    console.log(list)
  }, [list]);


  return (
    <div>
      <Header title={title} type={type} />
      {
        type === "playback" ? 
        <Playback
          i1={[progress, 34]}
          i2={activeItem?.from ?? ""}
          i3={12}
          i4={34}
          progress={progress}
          progressSteps={list.length}
          onChange={setProgress}
          handlers={handlers}
        /> :
        type === "list" ?
        <Layout>{children}</Layout> : null
      }
    </div>
  )
}

export default Panel;
