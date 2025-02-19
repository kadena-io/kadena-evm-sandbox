/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useContext } from '@app/context/context';
import type { TList } from '@app/context/context.type';
import React from 'react';
import styles from './list.module.css';

export type TConfig = {
  entity?: string;
  list?: TList<any>['list'] | null;
  operator?: 'contains' | 'equals';
  activeType?: 'highlight' | 'active';
  entityKeys?: string[];
  searchCols?: string[];
  customCount?: number;
  onClick?: (item: any) => void;
};

const ListItem: React.FC<{
  item: TList<any> | null;
  hasSearch: boolean;
  cols: {
    key: string;
    style?: Record<string, any>;
    formatter?: (data: any) => any;
  }[];
  config?: TConfig;
}> = ({ item, hasSearch, cols, config }) => {
  const state = useContext();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const searchColRef = React.useRef<HTMLSelectElement>(null);

  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchCol, setSearchCol] = React.useState((config?.searchCols?.[0] ?? ''));
  const [list, setList] = React.useState(item?.list);
  const [listCount, setListCount] = React.useState(
    config?.customCount ?? item?.list?.length,
  );

  const isActive = React.useCallback(
    (item: any, config: TConfig) => {
      const checkCounts = config.entityKeys?.length;
      const entity = state?.graph.active;

      const getEntityValue = (entity: any, path: string) => {
        return path.split('.').reduce((acc, part) => {
          return acc?.[part];
        }, entity);
      };

      if (config.operator && config.operator === 'contains') {
        return config.entityKeys?.some((key: string) => {
          const entityValue = config.entity
            ? getEntityValue(entity, config.entity)
            : null;
          return (
            entity &&
            item[key] &&
            entityValue?.some((entityItem: { [x: string]: string | any[] }) => {
              const isTrue = entityItem?.[key]?.includes(item[key]);
              if (isTrue) {
                return isTrue;
              }
              return false;
            })
          );
        });
      }

      return (
        config.entityKeys?.filter((key: string) => {
          const entityValue = config.entity
            ? getEntityValue(entity, config.entity)
            : null;
          return entity && item[key] === entityValue?.[key];
        }).length === checkCounts
      );
    },
    [state?.graph.active],
  );

  const checkActive = React.useCallback(
    (item: any, config: TConfig) => {
      return isActive(item, config) ? styles.activeItem : '';
    },
    [isActive],
  );

  const checkHighlight = React.useCallback(
    (item: any, config: TConfig) => {
      return isActive(item, config) ? styles.highlightItem : '';
    },
    [isActive],
  );

  const checkRow = React.useCallback(
    (item: any, config: TConfig) => {
      if (config.activeType === 'highlight') {
        return checkHighlight(item, config);
      }

      return checkActive(item, config);
    },
    [checkActive, checkHighlight],
  );

  const countLabel = React.useCallback(
    (listLength: number) => {
      if (searchTerm) {
        if (listCount === listLength) {
          return listLength;
        } else {
          return `${listLength}/${listCount}`;
        }
      }

      return listCount;
    },
    [listCount, searchTerm],
  );

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
    };
  }, [inputRef]);
  
  React.useEffect(() => {
    const select = searchColRef.current;

    if (select) {
      select.addEventListener('change', (e) => {
        setSearchCol((e.target as HTMLSelectElement).value);
      });
    }

    return () => {
      if (select) {
        select.removeEventListener('change', (e) => {
          setSearchCol((e.target as HTMLSelectElement).value);
        });
      }
    };
  }, [searchColRef, setSearchCol]);

  React.useEffect(() => {
    const list =
      hasSearch && !!searchTerm && !!searchCol
        ? item?.list?.filter((d) => String(d[searchCol])?.toLowerCase()?.includes(searchTerm.toLowerCase()))
        : item?.list;

    setList(list);
  }, [config?.searchCols, hasSearch, item, item?.list, searchCol, searchTerm]);

  React.useEffect(() => {
    if (config?.customCount) {
      setListCount(config.customCount);
    } else {
      setListCount(item?.list?.length);
    }
  }, [config?.customCount, item?.list?.length, listCount]);

  return (
    <div>
      <div className={styles.container}>
        {item?.title ? (
          <h2 className={styles.title}>
            {item.title} ({countLabel(list?.length ?? 0)})
          </h2>
        ) : null}
        <div className={styles.list}>
          {list?.map((item, itemIndex) => (
            <div
              key={`${JSON.stringify(item)}-${itemIndex}`}
              className={[
                styles.item,
                item &&
                  config?.entity &&
                  config?.entityKeys &&
                  checkRow(item, config),
              ].join(' ')}
              {...(typeof config?.onClick === 'function'
                ? { onClick: () => config?.onClick?.(item) }
                : {})}
            >
              {cols?.map((col, colIndex) => (
                <div
                  className={styles.itemContainer}
                  key={`col-${item[col.key]}-${colIndex}`}
                  {...(col.style ? { style: col.style } : {})}
                >
                  {typeof col.formatter === 'function'
                    ? col.formatter(item[col.key])
                    : item[col.key]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {hasSearch ? (
        <div
          className={[
            styles.searchWrapper,
            searchTerm ? styles.focussed : '',
          ].join(' ')}
        >
          <span className={styles.inner}>Search:</span>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            defaultValue={searchTerm}
          />
          {(config?.searchCols?.length ?? 0) > 1 ? (
            <select ref={searchColRef} className={styles.select}>
              {config?.searchCols?.map(searchCol => <option key={`option--${searchCol}`} value={searchCol}>{searchCol}</option>)}
            </select>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default ListItem;
