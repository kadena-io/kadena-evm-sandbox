"use client";

import React from "react";
import styles from "./list.module.css"
import ListItem from "./item";

const List: React.FC<any> = ({ data, hasSearch, cols, config={} }) => {
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
      <div key={`list-${index}`} className={styles.col}>
        <ListItem item={item} hasSearch={hasSearch} cols={cols} config={config} />
      </div>
    ))}
  </article>
}

export default List;
