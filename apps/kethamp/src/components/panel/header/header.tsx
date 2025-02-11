import type { PanelTypes } from "../panel";
import styles from "./header.module.css"

export type HeaderProps = {
  readonly title: string;
  type: PanelTypes;
  onClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, type, onClick }) => {
  return (
    <div onClick={onClick} className={[styles.container, styles[type]].join(' ')} role="button" tabIndex={0}>
      <h1 className={styles.title}>
        <span className={styles.inner}>{title}</span>
      </h1>
    </div>
  )
}

export default Header;
