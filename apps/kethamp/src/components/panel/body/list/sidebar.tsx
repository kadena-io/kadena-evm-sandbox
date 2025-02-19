/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import { useContext } from '@app/context/context';
import type { TAsideList } from '@app/context/context.type';
import React from 'react';
import ListItem, { TConfig } from './item';
import styles from './list.module.css';

const Aside: React.FC<{
  className?: string;
  data: TAsideList<any>;
  hasSearch?: boolean;
  cols: {
    key: string;
    style?: Record<string, any>;
    formatter?: (data: any) => any;
  }[];
  groupConfig?: TConfig;
  config?: TConfig;
}> = ({ hasSearch, cols, config, groupConfig, className, data }) => {
  const state = useContext();

  return (
    <>
      {data?.groups ? (
        <>
          <aside className={className}>
            <div className={styles.container}>
              <div className={styles.list}>
                {data.groups?.map((group, index) => (
                  <button
                    key={`group-${group.title}--${index}`}
                    className={[
                      styles.groupButton,
                      styles.item,
                      group.id === state?.graph.active.playlist.item?.id
                        ? styles.activeItem
                        : null,
                    ].join(' ')}
                    {...(groupConfig?.onClick
                      ? { onClick: () => groupConfig.onClick!(group) }
                      : {})}
                  >
                    {group.title}
                  </button>
                ))}
              </div>
            </div>
          </aside>
          <div className={styles.col} style={{}}>
            <ListItem
              item={{
                title: data.title,
                list: config?.list ?? [],
              }}
              hasSearch={!!hasSearch}
              cols={cols}
              config={config}
            />
          </div>
        </>
      ) : null}
    </>
  );
};

export default Aside;
