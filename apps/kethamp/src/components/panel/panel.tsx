"use client";

import Header from "@app/components/panel/header/header";
import type { HeaderProps } from "@app/components/panel/header/header";
import Playback from "@app/components/panel/body/playback/playback";
import React from "react";

export type PanelTypes = "playback";

export type PanelProps = {
  children?: React.ReactNode;
  type: PanelTypes;
  data: ListItem[];
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

export const Panel: React.FC<PanelProps> = ({ type, title, data, children }) => {
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
      <Header title={title} />
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
        /> : null
      }
      {children}
    </div>
  )
}

export default Panel;
