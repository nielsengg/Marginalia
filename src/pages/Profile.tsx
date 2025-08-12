import Header from '../components/Header'
import styles from '../assets/styles/Profile.module.css'

export default function Profile() {

return(
        <>
        <div className={`contentBody`}>
            <Header />
            
            <header className={`${styles.profileHeader}`}>
                <div className={`${styles.userInfo}`}>
                    <div className={`${styles.userPhotoContainer}`}>
                        <img className={`${styles.userPhoto} shinyBox`} src="img-book-template.png" alt="User's photo" />
                    </div>

                    <h2 className={`${styles.userName}`}>
                        Gustavo Nielsen
                    </h2>

                    <button className={`${styles.editProfileButton} cursorPointer`}>Edit Profile</button>
                </div>
                

                <figure className={`${styles.bookReadCountContainer}`}>
                    <h3 className={`${styles.bookReadCountNumber}`}>X</h3>
                    <figcaption className={`${styles.bookReadCountText}`}>Books</figcaption>
                </figure>
            </header>

            <main className={`${styles.profileBody}`}>
                <div className={`${styles.profileSectionContainer}`}>
                    <h3 className={`${styles.profileSubtitle}`}>Favorite Books</h3>
                    <ol className={`${styles.profileBookList}`}>
                        <li className={`${styles.bookItem} borderRadius`}>
                            <img className={`${styles.bookItemCover}`} src="img-book-template.png" alt="Favorite book cover" />
                        </li>
                        <li className={`${styles.bookItem} borderRadius`}>
                            <img className={`${styles.bookItemCover}`} src="img-book-template.png" alt="Favorite book cover" />                                             
                        </li>
                        <li className={`${styles.bookItem} borderRadius`}>
                            <img className={`${styles.bookItemCover}`} src="img-book-template.png" alt="Favorite book cover" />
                        </li>
                        <li className={`${styles.bookItem} borderRadius`}>
                            <img className={`${styles.bookItemCover}`} src="img-book-template.png" alt="Favorite book cover" />
                        </li>
                    </ol>
                </div>

                <div className={`${styles.profileSectionContainer}`}>
                    <h3 className={`${styles.profileSubtitle}`}>Recent Activity</h3>
                    <ol className={`${styles.profileBookList}`}>
                        <li className={`${styles.bookItem} borderRadius`}>
                            <img className={`${styles.bookItemCover}`} src="img-book-template.png" alt="Favorite book cover" />
                        </li>
                        <li className={`${styles.bookItem} borderRadius`}>
                            <img className={`${styles.bookItemCover}`} src="img-book-template.png" alt="Favorite book cover" />
                        </li>
                        <li className={`${styles.bookItem} borderRadius`}>
                            <img className={`${styles.bookItemCover}`} src="img-book-template.png" alt="Favorite book cover" />
                        </li>
                        <li className={`${styles.bookItem} borderRadius`}>
                            <img className={`${styles.bookItemCover}`} src="img-book-template.png" alt="Favorite book cover" />
                        </li>
                    </ol>
                </div>
            </main>
        </div>

        </>
    )
}