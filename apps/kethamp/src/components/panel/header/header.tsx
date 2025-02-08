import type { PanelTypes } from "../panel";
import styles from "./header.module.css"

export type HeaderProps = {
  readonly title: string;
  type: PanelTypes;
}

const Header: React.FC<HeaderProps> = ({ title, type }) => {
  return (
    <div className={[styles.container, styles[type]].join(' ')}>
      <h1 className={styles.title}>
        <span>{title}</span>
      </h1>
    </div>
  )
}

export default Header;
