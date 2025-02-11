"use client";

import React from "react";
import styles from "./list.module.css"
import { useContext } from "../../../../context/context";

const ListItem: React.FC<any> = ({ item, hasSearch, cols, config }) => {
  const state = useContext();
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [list, setList] = React.useState(item.list);
  const [listCount, setListCount] = React.useState(config.customCount ?? item.list.length);
  const [listCountDiff, setListCountDiff] = React.useState(item.list.length / listCount);

  const checkActive = React.useCallback((item, config) => {
    if (typeof config.entityKey === "string") {
      config.entityKey = [config.entityKey];
    }

    const checkCounts = config.entityKey.length

    return config.entityKey.filter((key) => item[key] === state.graph.active[config.entity]?.[key]).length === checkCounts
  }, [state.graph.active]);

  React.useEffect(() => {
    const input = inputRef.current;
    
    if (input) {
      input.addEventListener('input', (e) => {
        setSearchTerm((e.target as HTMLInputElement).value);
      });
    }

    return () => {
      if (input) {
        input.removeEventListener('input', (e) => {
          setSearchTerm((e.target as HTMLInputElement).value);
        });
      }
    }
  }, [inputRef]);

  React.useEffect(() => {
    const list = hasSearch && !!searchTerm
      ? item?.list?.filter((d) => String(d[config.searchCol])?.toLowerCase()?.includes(searchTerm.toLowerCase()))
      : item.list;
    
    setList(list);
  }, [config.searchCol, hasSearch, item, item.list, searchTerm]);

  React.useEffect(() => {
    if (config.customCount) {
      setListCount(config.customCount);
      setListCountDiff(item.list.length / listCount);
    } else {
      setListCount(item.list.length);
      setListCountDiff(0);
    }
  }, [config.customCount, item.list.length, listCount]);
  
  return (
    <div>
      <div className={styles.container}>
        {item.title ? <h2>{item.title}
          {' '}({ searchTerm ?
            listCount !== list.length ? list.length
            : listCount === list.length ? `${list.length}/${listCount}` : listCount : listCount })
        </h2> : null }
        <div className={styles.list}>
          { list?.map((item, i) =>
            <div
              id={`list-${i}`}
              key={i}
              className={[
                styles.item,
                item && config.entity && config.entityKey && 
                checkActive(item, config)
                  ? styles.activeItem
                  : ""
              ].join(' ')}
            >
              {cols?.map((col, colIndex) => 
                <div
                  key={`col-${colIndex}`}
                  {...(col.style ? { style: col.style } : {})}
                  {...(config.onClick ? { onClick: () => config.onClick(item) } : {})}
                >
                  { typeof col.formatter === 'function' ? col.formatter(item[col.key]) : item[col.key] }
                </div>
              )}
            </div>
          )}
        </div>
      </div> 
      {hasSearch ? <div className={[styles.searchWrapper, !!searchTerm ? styles.focussed : ""].join(' ')}>
        <span>Search:</span>
        <input ref={inputRef} type="text" className={styles.input} defaultValue={searchTerm} />
      </div> : null}
    </div>
  )
}

export default ListItem;
