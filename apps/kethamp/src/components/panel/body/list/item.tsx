"use client";

import React from "react";
import styles from "./list.module.css"

const ListItem: React.FC<any> = ({ item, hasSearch, cols, config }) => {
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [list, setList] = React.useState(item.list);

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
  
  return (
    <div>
      <div className={styles.container}>
        <h2>{item.title} {list.length === item.list.length ? `(${list.length})` : `(${list.length}/${item.list.length})`}</h2>
        <div className={styles.list}>
          { list?.map((item, i) => <div id={`list-${i}`} key={i} className={[styles.item].join(' ')}>
            {cols?.map((col, colIndex) => <div key={`col-${colIndex}`} {...(col.style ? { style: col.style } : {})}>{ typeof col.formatter === 'function' ? col.formatter(item[col.key]) : item[col.key] }</div>)}
          </div>) }
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
