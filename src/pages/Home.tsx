// import BookSearch from '../components/BookSearch';

export default function Home() {
  return (
    <div id="pricipalContainer">
        <div id="navigationBar">
            <div className="navLink">Log +</div>
            <div className="navLink">Search</div>

            <div id="logoBox">
              <img id="logo" src="/img-maginalia-logo.png" alt="Rabbit Marginalia Logo"/>
            </div>
            

            <div className="navLink">Profile</div>
            <div className="navLink">Settings</div>
        </div>

        <main id="contentContainer">
            <div id="readingBooksContainer">

            </div>
        </main>
      </div>
  );
}