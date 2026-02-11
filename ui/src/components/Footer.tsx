export default function Footer() {
  return (
    <footer className="site-footer" id="contacts">
      <div className="container footer-grid">
        <div>
          <h4>Информация</h4>
          <p>Editorial Policy</p>
          <p>Corrections</p>
          <p>Media Kit</p>
        </div>
        <div>
          <h4>Подписка по Email</h4>
          <p>Получайте срочные новости первыми!</p>
          <div className="footer-subscribe">
            <input type="email" placeholder="Email" />
            <button type="button">Отправить</button>
          </div>
        </div>
        <div>
          <h4>Контакты</h4>
          <p>7 Wilson Street</p>
          <p>San Diego, CA</p>
          <p>(123) 000-000</p>
        </div>
        <div className="footer-brand">ПОЗИТИВНЫЕ НОВОСТИ</div>
      </div>
    </footer>
  );
}
