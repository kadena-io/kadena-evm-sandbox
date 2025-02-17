/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React from "react";
import styles from "./list.module.css"
import ListItem, { TConfig } from "./item";
import { TList } from "@app/context/context.type";

const List: React.FC<{
  data: TList<any>[],
  hasSearch?: boolean,
  cols: {
    key: string;
    style?: Record<string, any>;
    formatter?: (data: any) => any;
  }[],
  config?: TConfig,
}> = ({ data, hasSearch=false, cols, config }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (data && ref.current) {
      const maxRows = Math.max(...data.map(item => item.list.length))
      
      ref.current.style.setProperty('--max-list-items', maxRows > 10 ? "10" : String(maxRows));
    }
  }, [data]);

  if (!data?.length) {
    return null
  }

  return <article ref={ref} className={styles.wrapper}>
    {data.map((item: any, index: number) => (
      <div key={`list-${index}`} className={styles.col} style={{ maxWidth: `${100 / data.length}%` }}>
        <ListItem item={item} hasSearch={hasSearch} cols={cols} config={config} />
      </div>
    ))}
  </article>
}

export default List;
