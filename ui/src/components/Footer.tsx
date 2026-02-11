export default function Footer() {
  return (
    <footer className="site-footer" id="contacts">
      <div className="container footer-grid">
        <div>
          <h4>Information</h4>
          <p>Editorial Policy</p>
          <p>Corrections</p>
          <p>Media Kit</p>
        </div>
        <div>
          <h4>Subscribe via Email</h4>
          <p>Get breaking news and enter to win gear!</p>
          <div className="footer-subscribe">
            <input type="email" placeholder="Email" />
            <button type="button">SUBMIT</button>
          </div>
        </div>
        <div>
          <h4>Contact Us</h4>
          <p>7 Wilson Street</p>
          <p>San Diego, CA</p>
          <p>(123) 000-000</p>
        </div>
        <div className="footer-brand">ПОЗИТИВНЫЕ НОВОСТИ</div>
      </div>
    </footer>
  );
}
