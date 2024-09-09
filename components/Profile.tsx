import { User } from 'firebase/auth';
import styles from '../styles/Profile.module.css';

export type Profile = {
  user: User | null;
};

export const Profile = ({ user }: Profile) => {
  const displayName = user?.displayName;
  const imgSrc = user?.photoURL || '';

  if (user)
    return (
      <>
        <img
          className={styles.roundedPolygon}
          src={imgSrc}
          alt="Profile Picture"
        />
        <span className="hidden md:block mx-2  dark:text-white">
          {displayName}
        </span>
      </>
    );
};
