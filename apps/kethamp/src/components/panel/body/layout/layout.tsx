"use client";

import React from "react";
import styles from "./layout.module.css"


const Layout: React.FC<any> = ({ expand, children }) => {
  return <section className={styles.wrapper} data-expand={expand}>
    <div className={styles.container}>
      {children}
    </div>
  </section>
}

export default Layout;
