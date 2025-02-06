import styles from "./header.module.css"

export type HeaderProps = {
  readonly title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>
        <span>{title}</span>
      </h1>
    </div>
  )
}

export default Header;
