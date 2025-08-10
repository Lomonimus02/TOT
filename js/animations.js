// Анимации для сайта "Пирамида ТОТА"

class AnimationController {
    constructor() {
        this.observers = [];
        this.animationQueue = [];
        this.isAnimating = false;
        
        this.init();
    }
    
    init() {
        this.setupIntersectionObserver();
        this.setupScrollAnimations();
        this.setupHoverEffects();
        this.setupClickEffects();
    }
    
    // Настройка наблюдателя пересечений для анимаций при скролле
    setupIntersectionObserver() {
        const options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateElement(entry.target);
                }
            });
        }, options);
        
        // Элементы для анимации при появлении (исключены заголовки для устранения тряски)
        const elementsToAnimate = document.querySelectorAll([
            '.cartouche',
            '.additional-sections section',
            // '.menu-item', - убрано для устранения тряски
            '.contact-details p',
            '.form-group'
        ].join(','));
        
        elementsToAnimate.forEach(el => {
            observer.observe(el);
        });
        
        this.observers.push(observer);
    }
    
    // Анимация элемента при появлении
    animateElement(element) {
        const animationType = element.dataset.animation || 'fadeInUp';
        const delay = element.dataset.delay || 0;
        
        setTimeout(() => {
            element.classList.add(`animate-${animationType}`);
            element.style.opacity = '1';
        }, delay);
    }
    
    // Настройка анимаций при скролле
    setupScrollAnimations() {
        let ticking = false;
        
        const updateAnimations = () => {
            const scrollY = window.pageYOffset;
            const windowHeight = window.innerHeight;
            
            // Параллакс для фона
            this.updateParallax(scrollY);
            
            // Анимация навигации при скролле
            this.updateNavigation(scrollY);
            
            // Анимация элементов при скролле
            this.updateScrollElements(scrollY, windowHeight);
            
            ticking = false;
        };
        
        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateAnimations);
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', requestTick, { passive: true });
    }
    
    // Обновление параллакс эффекта
    updateParallax(scrollY) {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        parallaxElements.forEach(element => {
            const speed = parseFloat(element.dataset.parallax) || 0.5;
            const yPos = -(scrollY * speed);
            element.style.transform = `translateY(${yPos}px)`;
        });
    }
    
    // Обновление навигации при скролле
    updateNavigation(scrollY) {
        const navbar = document.querySelector('.navbar');
        
        if (navbar) {
            if (scrollY > 100) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    }
    
    // Обновление элементов при скролле
    updateScrollElements(scrollY, windowHeight) {
        const elements = document.querySelectorAll('[data-scroll-animation]');
        
        elements.forEach(element => {
            const elementTop = element.offsetTop;
            const elementHeight = element.offsetHeight;
            const elementBottom = elementTop + elementHeight;
            
            const isVisible = (elementBottom >= scrollY) && (elementTop <= scrollY + windowHeight);
            
            if (isVisible) {
                const animationType = element.dataset.scrollAnimation;
                element.classList.add(`animate-${animationType}`);
            }
        });
    }
    
    // Настройка эффектов при наведении - только для элементов без CSS hover
    setupHoverEffects() {
        const hoverElements = document.querySelectorAll([
            '.submit-btn',
            '.cartouche'
            // Убираем '.menu-link' и '.nav-link' - у них есть CSS hover
        ].join(','));

        hoverElements.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.addHoverEffect(e.target);
            });

            element.addEventListener('mouseleave', (e) => {
                this.removeHoverEffect(e.target);
            });
        });
    }
    
    // Добавление эффекта при наведении
    addHoverEffect(element) {
        element.classList.add('hover-active');
        
        // Специальные эффекты для разных типов элементов
        if (element.classList.contains('menu-link')) {
            this.animateMenuLink(element);
        } else if (element.classList.contains('cartouche')) {
            this.animateCartouche(element);
        }
    }
    
    // Удаление эффекта при наведении
    removeHoverEffect(element) {
        element.classList.remove('hover-active');
    }
    
    // Анимация ссылки меню - упрощенная версия без конфликтов
    animateMenuLink(element) {
        const icon = element.querySelector('.menu-icon');
        if (icon) {
            icon.style.transform = 'scale(1.1)';
            icon.style.transition = 'transform 0.2s ease';

            setTimeout(() => {
                icon.style.transform = 'scale(1)';
            }, 200);
        }
    }
    
    // Анимация картуша
    animateCartouche(element) {
        element.style.transform = 'translateY(-10px) scale(1.02)';
        element.style.transition = 'transform 0.3s ease';
    }
    
    // Настройка эффектов при клике
    setupClickEffects() {
        const clickElements = document.querySelectorAll([
            '.menu-link',
            '.submit-btn',
            '.nav-link'
        ].join(','));
        
        clickElements.forEach(element => {
            element.addEventListener('click', (e) => {
                this.addClickEffect(e.target);
            });
        });
    }
    
    // Добавление эффекта при клике
    addClickEffect(element) {
        element.classList.add('click-active');
        
        // Создание волнового эффекта
        this.createRippleEffect(element, event);
        
        setTimeout(() => {
            element.classList.remove('click-active');
        }, 300);
    }
    
    // Создание волнового эффекта
    createRippleEffect(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 215, 0, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
    
    // Анимация появления страницы
    animatePageEntry() {
        const elements = document.querySelectorAll([
            '.site-header',
            '.cartouche',
            '.additional-sections section'
        ].join(','));
        
        elements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(50px)';
            
            setTimeout(() => {
                element.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 200);
        });
    }
    
    // Анимация ухода со страницы
    animatePageExit() {
        return new Promise((resolve) => {
            const elements = document.querySelectorAll([
                '.site-header',
                '.cartouche',
                '.additional-sections section'
            ].join(','));
            
            elements.forEach((element, index) => {
                setTimeout(() => {
                    element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    element.style.opacity = '0';
                    element.style.transform = 'translateY(-50px)';
                }, index * 100);
            });
            
            setTimeout(resolve, elements.length * 100 + 500);
        });
    }
    
    // Анимация модального окна
    animateModal(modal, show = true) {
        if (show) {
            modal.style.display = 'block';
            modal.style.opacity = '0';
            modal.querySelector('.modal-content').style.transform = 'scale(0.7)';
            
            requestAnimationFrame(() => {
                modal.style.transition = 'opacity 0.3s ease';
                modal.querySelector('.modal-content').style.transition = 'transform 0.3s ease';
                modal.style.opacity = '1';
                modal.querySelector('.modal-content').style.transform = 'scale(1)';
            });
        } else {
            modal.style.transition = 'opacity 0.3s ease';
            modal.querySelector('.modal-content').style.transition = 'transform 0.3s ease';
            modal.style.opacity = '0';
            modal.querySelector('.modal-content').style.transform = 'scale(0.7)';
            
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }
    
    // Анимация загрузки
    showLoadingAnimation(container) {
        const loader = document.createElement('div');
        loader.className = 'loading-spinner';
        loader.innerHTML = '<div class="spinner"></div>';
        
        container.appendChild(loader);
        
        return loader;
    }
    
    hideLoadingAnimation(loader) {
        if (loader && loader.parentNode) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.parentNode.removeChild(loader);
            }, 300);
        }
    }
    
    // Очистка наблюдателей
    destroy() {
        this.observers.forEach(observer => {
            observer.disconnect();
        });
        this.observers = [];
    }
}

// Добавление CSS для анимаций через JavaScript
const animationStyles = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .hover-active {
        transform: translateY(-5px);
        box-shadow: 0 10px 25px rgba(255, 215, 0, 0.3);
    }
    
    .click-active {
        transform: scale(0.95);
    }
    
    .navbar.scrolled {
        background: rgba(26, 26, 46, 0.95);
        box-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
    }
`;

// Добавление стилей в документ
const styleSheet = document.createElement('style');
styleSheet.textContent = animationStyles;
document.head.appendChild(styleSheet);

// Инициализация контроллера анимаций
let animationController;

document.addEventListener('DOMContentLoaded', () => {
    animationController = new AnimationController();

    // Убираем анимацию входа на страницу для устранения тряски
    // setTimeout(() => {
    //     animationController.animatePageEntry();
    // }, 100);
});

// Экспорт для использования в других файлах
window.AnimationController = AnimationController;
window.animationController = animationController;
