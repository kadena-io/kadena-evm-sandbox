"use client";

import React from "react";
import styles from "./list.module.css"
import ListItem from "./item";

const List: React.FC<any> = ({ data, hasSearch, cols, config={} }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (data && ref.current) {
      const wrapperRefCssVariable = getComputedStyle(ref.current).getPropertyValue('--max-list-items');
      const defaultMaxRows = wrapperRefCssVariable ? parseInt(wrapperRefCssVariable) : 10;
      const [chain] = data;
      const maxRows = chain?.list?.length && chain.list.length < 10 ? chain.list.length : defaultMaxRows;

      ref.current.style.setProperty('--max-list-items', maxRows.toString());
    }
  }, [data]);



  return <article ref={ref} className={styles.wrapper}>
    {data.map((item: any, index: number) => (
      <div key={`list-${index}`} className={styles.col}>
        <ListItem item={item} hasSearch={hasSearch} cols={cols} config={config} />
      </div>
    ))}
  </article>
}

export default List;
