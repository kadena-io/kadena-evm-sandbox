/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React from "react";
import styles from "./list.module.css"
import ListItem, { TConfig } from "./item";
import { TAsideList, TList } from "@app/context/context.type";
import Aside from "./sidebar";

const List: React.FC<{
  sidebar?: boolean,
  groupedData?: TAsideList<any>,
  data?: TList<any>[],
  hasSearch?: boolean,
  cols: {
    key: string;
    style?: Record<string, any>;
    formatter?: (data: any) => any;
  }[],
  groupConfig?: TConfig,
  config?: TConfig,
}> = ({ data, groupedData, hasSearch=false, cols, config, groupConfig, sidebar }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (data && ref.current) {
      const maxRows = Math.max(...data.map(item => item?.list?.length ?? 0))
      
      ref.current.style.setProperty('--max-list-items', maxRows > 10 ? "10" : String(maxRows));
    }
  }, [data]);

  if (!sidebar && !data?.length) {
    return null
  }

  return <article ref={ref} className={styles.wrapper}>
    {sidebar && groupedData ? <Aside className={styles.aside} data={groupedData} hasSearch={hasSearch} cols={cols} config={config} groupConfig={groupConfig} /> : null}
    {data?.map((item: any, index: number) => (
      <div key={`list-${index}`} className={styles.col} style={{ maxWidth: `${100 / data.length}%` }}>
        <ListItem item={item} hasSearch={hasSearch} cols={cols} config={config} />
      </div>
    ))}
  </article>
}

export default List;
