const fs = require('fs');
const path = require('path');

// Получаем список всех HTML файлов в папке pages
const pagesDir = path.join(__dirname, '..', 'pages');
const files = fs.readdirSync(pagesDir).filter(file => 
    file.endsWith('.html') && file !== 'template.html'
);

const footerHTML = `
    <!-- Подвал сайта -->
    <footer class="site-footer">
        <div class="footer-content">
            <!-- Контакты -->
            <div class="footer-section">
                <h3>Контакты</h3>
                <div class="footer-contacts">
                    <div class="footer-contact-item">
                        <a href="https://t.me/V_Isais" target="_blank">Telegram: @V_Isais</a>
                    </div>
                    <div class="footer-contact-item">
                        <a href="https://maxln.ru/YcxBcz" target="_blank">Max: Пирамида Тота</a>
                    </div>
                    <div class="footer-contact-item">
                        <a href="mailto:info@piramidaspb.ru">info@piramidaspb.ru</a>
                    </div>
                </div>
            </div>

            <!-- Подписка на рассылку -->
            <div class="footer-section">
                <h3>Подписка на рассылку</h3>
                <form class="newsletter-form" id="newsletterForm">
                    <input type="email" class="newsletter-input" placeholder="Ваш email" required>
                    <button type="submit" class="newsletter-btn">Подписаться</button>
                </form>
            </div>

            <!-- Социальные сети -->
            <div class="footer-section">
                <h3>Мы в социальных сетях</h3>
                <div class="social-links">
                    <a href="https://vk.com/club187535764" class="social-link" target="_blank" title="ВКонтакте">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024"><path d="M179.929 32h664.142C925.767 32 992 98.23 992 179.929v664.142C992 925.767 925.767 992 844.071 992H179.929C98.23 992 32 925.767 32 844.071V179.929C32 98.23 98.23 32 179.929 32" fill="#4c75a3"/><path d="M503.946 704.029h39.269s11.858-1.307 17.922-7.831c5.573-5.997 5.395-17.249 5.395-17.249s-.768-52.692 23.683-60.451c24.113-7.649 55.07 50.924 87.88 73.447 24.812 17.039 43.667 13.31 43.667 13.31l87.739-1.226s45.894-2.832 24.131-38.918c-1.781-2.947-12.678-26.693-65.238-75.48-55.019-51.063-47.644-42.802 18.626-131.128 40.359-53.791 56.491-86.629 51.45-100.692-4.803-13.4-34.49-9.86-34.49-9.86l-98.785.611s-7.329-.997-12.757 2.251c-5.309 3.177-8.717 10.598-8.717 10.598s-15.641 41.622-36.486 77.025c-43.988 74.693-61.58 78.647-68.77 73.001-16.729-10.811-12.549-43.422-12.549-66.596 0-72.389 10.98-102.57-21.381-110.383-10.737-2.591-18.647-4.306-46.11-4.585-35.25-.359-65.078.108-81.971 8.384-11.239 5.504-19.91 17.765-14.626 18.47 6.531.87 21.314 3.991 29.152 14.656 10.126 13.777 9.772 44.703 9.772 44.703s5.818 85.212-13.585 95.794c-13.314 7.26-31.581-7.56-70.799-75.327-20.09-34.711-35.264-73.085-35.264-73.085s-2.922-7.17-8.141-11.007c-6.33-4.65-15.174-6.124-15.174-6.124l-93.877.613s-14.089.393-19.267 6.522c-4.606 5.455-.369 16.724-.369 16.724s73.49 171.949 156.711 258.598c76.315 79.454 162.957 74.24 162.957 74.24" fill="#fff"/></svg>
                    </a>
                    <a href="https://t.me/piramidatota" class="social-link" target="_blank" title="Телеграм">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240"><defs><linearGradient id="tg-grad" x1="120" y1="240" x2="120" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1d93d2"/><stop offset="1" stop-color="#38b0e3"/></linearGradient></defs><circle cx="120" cy="120" r="120" fill="url(#tg-grad)"/><path d="M81.229 128.772l14.237 39.406s1.78 3.687 3.686 3.687 30.255-29.492 30.255-29.492l31.525-60.89-79.195 36.017z" fill="#c8daea"/><path d="M100.106 138.878l-2.733 29.046s-1.144 8.9 7.754 0 17.415-15.763 17.415-15.763" fill="#a9c6d8"/><path d="M81.486 130.178l-29.286-9.542s-3.5-1.42-2.373-4.64c.232-.664.7-1.229 2.1-2.2 6.489-4.523 120.106-45.36 120.106-45.36s3.208-1.081 5.1-.362a2.766 2.766 0 0 1 1.885 2.055 9.357 9.357 0 0 1 .254 2.585c-.009.752-.1 1.449-.169 2.542-.692 11.165-21.4 94.493-21.4 94.493s-1.239 4.876-5.678 5.043a8.13 8.13 0 0 1-5.925-2.292c-8.711-7.493-38.819-27.727-45.472-32.177a1.27 1.27 0 0 1-.546-.9c-.093-.469.417-1.05.417-1.05s52.426-46.6 53.821-51.492c.108-.379-.3-.566-.848-.4-3.482 1.281-63.844 39.4-70.506 43.607a3.21 3.21 0 0 1-1.48.094z" fill="#fff"/></svg>
                    </a>
                    <a href="https://rutube.ru/channel/42454841" class="social-link" target="_blank" title="РуТуб">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132 132"><defs><clipPath id="rt-clip"><rect width="132" height="132" rx="32" fill="#fff"/></clipPath></defs><g clip-path="url(#rt-clip)"><rect width="132" height="132" fill="#100943"/><path d="M132 66c36.451 0 66-29.549 66-66s-29.549-66-66-66-66 29.549-66 66 29.549 66 66 66z" fill="#ed143b"/><path d="M81.536 62.987H42.539V47.555h38.997c2.278 0 3.862.397 4.657 1.09.795.694 1.287 1.98 1.287 3.858v5.541c0 1.979-.492 3.265-1.287 3.959-.795.693-2.379.99-4.657.99v-.006zm2.676-29.981H26v66h16.539V77.53h30.479L87.48 99h18.52L90.055 77.43c5.878-.872 8.518-2.673 10.695-5.642 2.177-2.97 3.269-7.717 3.269-14.052v-4.948c0-3.757-.398-6.726-1.092-8.002-.694-2.275-1.88-4.255-3.565-6.033-1.78-1.683-3.761-2.868-6.14-3.662-2.379-.693-5.351-1.09-9.011-1.09v.006z" fill="#fff"/></g></svg>
                    </a>
                    <a href="https://maxln.ru/YcxBcz" class="social-link" target="_blank" title="Max">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><linearGradient id="max-a"><stop offset="0" stop-color="#4cf"/><stop offset=".662" stop-color="#53e"/><stop offset="1" stop-color="#93d"/></linearGradient><linearGradient id="max-b"><stop offset="0" stop-color="#00f"/><stop offset="1" stop-opacity="0"/><stop offset="1" stop-opacity="0"/></linearGradient><linearGradient id="max-c" x1="117.847" x2="1000" y1="760.536" y2="500" gradientUnits="userSpaceOnUse" href="#max-a"/><radialGradient id="max-d" cx="-87.392" cy="1166.116" r="500" fx="-87.392" fy="1166.116" gradientTransform="rotate(51.356 1551.478 559.3)scale(2.42703433 1)" gradientUnits="userSpaceOnUse" href="#max-b"/></defs><rect width="1000" height="1000" fill="url(#max-c)" ry="249.681"/><rect width="1000" height="1000" fill="url(#max-d)" ry="249.681"/><path fill="#fff" fill-rule="evenodd" d="M508.211 878.328c-75.007 0-109.864-10.95-170.453-54.75-38.325 49.275-159.686 87.783-164.979 21.9 0-49.456-10.95-91.248-23.36-136.873-14.782-56.21-31.572-118.807-31.572-209.508 0-216.626 177.754-379.597 388.357-379.597 210.785 0 375.947 171.001 375.947 381.604.707 207.346-166.595 376.118-373.94 377.224m3.103-571.585c-102.564-5.292-182.499 65.7-200.201 177.024-14.6 92.162 11.315 204.398 33.397 210.238 10.585 2.555 37.23-18.98 53.837-35.587a189.8 189.8 0 0 0 92.71 33.032c106.273 5.112 197.08-75.794 204.215-181.95 4.154-106.382-77.67-196.486-183.958-202.574z" clip-rule="evenodd"/></svg>
                    </a>
                </div>
            </div>

            <!-- Копирайт -->
            <div class="footer-copyright">
                2019 - 2025г. Все права защищены, Isais ©
            </div>
        </div>
    </footer>`;

files.forEach(file => {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Проверяем, есть ли уже подвал
    if (content.includes('site-footer')) {
        console.log(`Подвал уже есть в ${file}`);
        return;
    }
    
    // Ищем место для вставки подвала (перед закрывающими тегами body и html)
    const insertPosition = content.lastIndexOf('</body>');
    
    if (insertPosition !== -1) {
        // Вставляем подвал перед </body>
        content = content.slice(0, insertPosition) + footerHTML + '\n\n' + content.slice(insertPosition);
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Подвал добавлен в ${file}`);
    } else {
        console.log(`Не удалось найти место для вставки подвала в ${file}`);
    }
});

console.log('Обработка завершена');
