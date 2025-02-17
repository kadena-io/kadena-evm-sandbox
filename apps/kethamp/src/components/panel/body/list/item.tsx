/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React from "react";
import styles from "./list.module.css"
import { useContext } from "@app/context/context";
import type { TList } from "@app/context/context.type";

export type TConfig = {
  entity?: string;
  operator?: "contains" | "equals";
  activeType?: "highlight" | "active";
  entityKeys?: string[];
  searchCol?: string;
  customCount?: number;
  onClick?: (item: any) => void;
}

const ListItem: React.FC<{
  item: TList<any>,
  hasSearch: boolean,
  cols: {
    key: string;
    style?: Record<string, any>;
    formatter?: (data: any) => any;
  }[],
  config?: TConfig,
}> = ({ item, hasSearch, cols, config }) => {
  const state = useContext();
  const inputRef = React.useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [list, setList] = React.useState(item.list);
  const [listCount, setListCount] = React.useState(config?.customCount ?? item.list.length);

  const isActive = React.useCallback((item: any, config: TConfig) => {
    const checkCounts = config.entityKeys?.length
    const entity = state?.graph.active;

    if (config.operator && config.operator === 'contains') {
      return config.entityKeys?.some(
        (key: string) =>
          entity && item[key] && config.entity &&
          (entity[config.entity as keyof typeof entity] as any)
            ?.some((entityItem: { [x: string]: string | any[]; }) => {
              const isTrue = entityItem?.[key]?.includes(item[key])
              if (isTrue) {
                return isTrue;
              }
              
              return false;
            }
          ))
    }
    
    return config.entityKeys?.filter((key: string) => entity && item[key] === (entity[config.entity as keyof typeof entity] as any)?.[key]).length === checkCounts
  }, [state?.graph.active]);

  const checkActive = React.useCallback((item: any, config: TConfig) => {
    return isActive(item, config) ? styles.activeItem : "";

  }, [isActive]);
  
  const checkHighlight = React.useCallback((item: any, config: TConfig) => {
    return isActive(item, config) ? styles.highlightItem : "";
  }, [isActive]);

  const checkRow = React.useCallback((item: any, config: TConfig) => {
    if (config.activeType === 'highlight') {
      return checkHighlight(item, config)
    }

    return checkActive(item, config)
  }, [checkActive, checkHighlight]);

  const countLabel = React.useCallback((listLength: number) => {
    if (searchTerm) {
      debugger
      if (listCount === listLength) {
        return listLength
      } else {
        return `${listLength}/${listCount}`
      }
    }

    return listCount
  }, [listCount, searchTerm]);

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
    const list = hasSearch && !!searchTerm && !!config?.searchCol
      ? item?.list?.filter((d) => config.searchCol && String(d[config.searchCol])?.toLowerCase()?.includes(searchTerm.toLowerCase()))
      : item.list;
    
    setList(list);
  }, [config?.searchCol, hasSearch, item, item.list, searchTerm]);

  React.useEffect(() => {
    if (config?.customCount) {
      setListCount(config.customCount);
    } else {
      setListCount(item.list.length);
    }
  }, [config?.customCount, item.list.length, listCount]);
  
  return (
    <div>
      <div className={styles.container}>
        {item.title ? <h2 className={styles.title}>{item.title}{' '}({ countLabel(list.length) })</h2> : null }
        <div className={styles.list}>
          { list?.map((item, itemIndex) =>
            <div
              key={`${JSON.stringify(item)}-${itemIndex}`}
              className={[
                styles.item,
                item && config?.entity && config?.entityKeys && 
                checkRow(item, config),
              ].join(' ')}
              {...(typeof config?.onClick === 'function' ? { onClick: () => config?.onClick?.(item) } : {})}
            >
              {cols?.map((col, colIndex) => 
                <div
                  className={styles.itemContainer}
                  key={`col-${item[col.key]}-${colIndex}`}
                  {...(col.style ? { style: col.style } : {})}
                >
                  { typeof col.formatter === 'function' ? col.formatter(item[col.key]) : item[col.key] }
                </div>
              )}
            </div>
          )}
        </div>
      </div> 
      {hasSearch ? <div className={[styles.searchWrapper, searchTerm ? styles.focussed : ""].join(' ')}>
        <span className={styles.inner}>Search:</span>
        <input ref={inputRef} type="text" className={styles.input} defaultValue={searchTerm} />
      </div> : null}
    </div>
  )
}

export default ListItem;
