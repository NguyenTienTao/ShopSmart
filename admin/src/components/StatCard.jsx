import styles from "./StatCard.module.scss";

const StatCard = ({ title, value, icon, color }) => (
    <div className={styles.statCard}>
        <div className={styles.content}>
            <span className={styles.title}>{title}</span>
            <h4 className={styles.value}>{value}</h4>
        </div>
        <div className={`${styles.iconBox} ${styles[color]}`}>{icon}</div>
    </div>
);

export default StatCard;
