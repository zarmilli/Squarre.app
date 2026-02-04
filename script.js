const burger = document.querySelector('.burger');
const navLinks = document.querySelector('.nav-links');
const heroContent = document.querySelector('.hero-content');

burger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// Hero entrance animation
window.addEventListener('load', () => {
  heroContent.classList.add('animate');
});

const reveals = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
        observer.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.2
  }
);

reveals.forEach(el => observer.observe(el));

const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 80) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

const cookiePopup = document.getElementById('cookiePopup');
const cookieAccept = document.getElementById('cookieAccept');

// Show popup after 3 seconds if not accepted
window.addEventListener('load', () => {
  const accepted = localStorage.getItem('cookiesAccepted');

  if (!accepted) {
    setTimeout(() => {
      cookiePopup.classList.add('show');
    }, 3000);
  }
});

// Accept cookies
cookieAccept.addEventListener('click', () => {
  localStorage.setItem('cookiesAccepted', 'true');
  cookiePopup.classList.remove('show');
});

  const cards = document.querySelectorAll('[data-card]');

  cards.forEach((card) => {
    card.addEventListener('click', () => {
      cards.forEach((c) => {
        if (c !== card) c.classList.remove('is-active');
      });

      card.classList.toggle('is-active');
    });
  });

const darkSections = document.querySelectorAll('.dark-section');

const navbarObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navbar.classList.add('navbar, navbar-inner, nav-links a');
      } else {
        navbar.classList.remove('navbar, navbar-inner, nav-links a');
      }
    });
  },
  {
    threshold: 0.4
  }
);

darkSections.forEach(section => navbarObserver.observe(section));

const carousel = document.querySelector('.testimonial-carousel');
const testimonialscards = document.querySelectorAll('.testimonial-card');

let activeIndex = 0;

carousel.addEventListener('scroll', () => {
  const center = carousel.scrollLeft + carousel.offsetWidth / 2;

  cards.forEach((card, index) => {
    const cardCenter = card.offsetLeft + card.offsetWidth / 2;
    if (Math.abs(center - cardCenter) < card.offsetWidth / 2) {
      activeIndex = index;
    }
  });
});

window.addEventListener('load', () => {
  const carousel = document.querySelector('.testimonial-carousel');
  const cards = document.querySelectorAll('.testimonial-card');

  if (cards.length > 1) {
    cards[1].scrollIntoView({
      behavior: 'instant',
      inline: 'center',
      block: 'nearest'
    });
  }
});

const toggleLabels = document.querySelectorAll('.toggle-label');
const toggleThumb = document.querySelector('.toggle-thumb');
const prices = document.querySelectorAll('.price');
const saveTexts = document.querySelectorAll('.save-text');

let mode = 'monthly';

function updatePricing() {
  prices.forEach((price, index) => {
    const monthly = Number(price.dataset.monthly);
    const yearly = Number(price.dataset.yearly);

    if (mode === 'monthly') {
      price.textContent = `R${monthly}`;
      saveTexts[index].textContent = '';
      toggleThumb.style.transform = 'translateX(0)';
    } else {
      price.textContent = `R${yearly}`;
      const save = monthly * 12 - yearly;
      saveTexts[index].textContent =
        save > 0 ? `Save R${save}` : '';
      toggleThumb.style.transform = 'translateX(24px)';
    }
  });
}

toggleLabels.forEach(label => {
  label.addEventListener('click', () => {
    mode = label.dataset.mode;
    toggleLabels.forEach(l => l.classList.remove('active'));
    label.classList.add('active');
    updatePricing();
  });
});

updatePricing();
