(() => {
  const backToTop = document.querySelector('.back-to-top');
  let ticking = false;
  const updateScroll = () => {
    backToTop?.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.75);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); }
  }, { passive: true });
  updateScroll();

  // Preview only existing content. No service pages or itinerary copy are invented.
  const contentPreview = document.getElementById('content-preview');
  const previewBody = contentPreview?.querySelector('.content-preview-body');
  document.querySelectorAll('[data-preview]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!previewBody || !contentPreview) return;
      previewBody.replaceChildren();
      const card = document.querySelector('.postcard-collage .itinerary-card').cloneNode(true);
      card.removeAttribute('id');
      previewBody.append(card);
      previewBody.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
      let title = previewBody.querySelector('h3');
      if (!title) {
        title = document.createElement('h3');
        title.textContent = button.closest('section').querySelector('h2')?.textContent || 'Anteprima';
        previewBody.prepend(title);
      }
      title.id = 'content-preview-title';
      if (!title.dataset.copyRef) {
        const sourceRef = button.dataset.copyRef || button.closest('section')?.querySelector('h2[data-copy-ref]')?.dataset.copyRef;
        if (sourceRef) {
          title.classList.add('copy-ref');
          title.dataset.copyRef = sourceRef;
        }
      }
      contentPreview.showModal();
    });
  });
  contentPreview?.querySelector('.preview-close')?.addEventListener('click', () => contentPreview.close());

  const contactForm = document.getElementById('contact-form');
  const dateField = contactForm?.querySelector('.contact-date-field');
  const dateTrigger = dateField?.querySelector('.contact-date-trigger');
  const calendar = dateField?.querySelector('.contact-calendar');
  const dateInput = dateField?.querySelector('#departure-date');
  const dateValue = dateField?.querySelector('#departure-value');
  if (calendar && dateTrigger && dateInput && dateValue) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let month = new Date(today.getFullYear(), today.getMonth(), 1);
    let selected = null;
    const monthLabel = calendar.querySelector('.calendar-month');
    const days = calendar.querySelector('.contact-calendar-days');
    const closeCalendar = () => {
      calendar.hidden = true;
      dateTrigger.setAttribute('aria-expanded', 'false');
    };
    const renderCalendar = () => {
      monthLabel.textContent = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' }).format(month);
      calendar.querySelector('.calendar-prev').disabled = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
      days.replaceChildren();
      const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
      for (let i = 0; i < offset; i++) days.append(document.createElement('span'));
      const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      for (let day = 1; day <= count; day++) {
        const date = new Date(month.getFullYear(), month.getMonth(), day);
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(day);
        button.disabled = date < today;
        button.setAttribute('aria-label', new Intl.DateTimeFormat('it-IT', { dateStyle: 'full' }).format(date));
        button.setAttribute('aria-pressed', String(selected?.getTime() === date.getTime()));
        button.addEventListener('click', () => {
          selected = date;
          dateInput.value = new Intl.DateTimeFormat('it-IT').format(date);
          dateValue.textContent = dateInput.value;
          dateTrigger.classList.add('has-value');
          closeCalendar();
          dateTrigger.focus();
        });
        days.append(button);
      }
    };
    dateTrigger.addEventListener('click', () => {
      calendar.hidden = !calendar.hidden;
      dateTrigger.setAttribute('aria-expanded', String(!calendar.hidden));
      if (!calendar.hidden) renderCalendar();
    });
    calendar.querySelector('.calendar-prev').addEventListener('click', () => { month = new Date(month.getFullYear(), month.getMonth() - 1, 1); renderCalendar(); });
    calendar.querySelector('.calendar-next').addEventListener('click', () => { month = new Date(month.getFullYear(), month.getMonth() + 1, 1); renderCalendar(); });
    calendar.querySelector('.calendar-today').addEventListener('click', () => {
      month = new Date(today.getFullYear(), today.getMonth(), 1);
      renderCalendar();
      days.querySelector('button:not(:disabled)')?.click();
    });
    calendar.querySelector('.calendar-clear').addEventListener('click', () => {
      selected = null;
      dateInput.value = '';
      dateValue.textContent = 'Quando pensi di partire?';
      dateTrigger.classList.remove('has-value');
      closeCalendar();
      dateTrigger.focus();
    });
    document.addEventListener('pointerdown', event => { if (!dateField.contains(event.target)) closeCalendar(); });
    dateField.addEventListener('keydown', event => { if (event.key === 'Escape' && !calendar.hidden) { event.preventDefault(); closeCalendar(); dateTrigger.focus(); } });
  }

  const travelerInput = contactForm?.querySelector('#traveler-count');
  const travelerOutput = contactForm?.querySelector('.travelers-value');
  const travelerMinus = contactForm?.querySelector('.travelers-minus');
  const travelerPlus = contactForm?.querySelector('.travelers-plus');
  const setTravelers = count => {
    if (!travelerInput || !travelerOutput || !travelerMinus) return;
    travelerInput.value = String(Math.max(1, count));
    travelerOutput.value = travelerInput.value;
    travelerMinus.disabled = Number(travelerInput.value) === 1;
  };
  travelerMinus?.addEventListener('click', () => setTravelers(Number(travelerInput.value) - 1));
  travelerPlus?.addEventListener('click', () => setTravelers(Number(travelerInput.value) + 1));
  contactForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;

    const data = new FormData(contactForm);
    const body = [
      `Nome: ${data.get('nome') || ''}`,
      `Email: ${data.get('email') || ''}`,
      `Destinazione: ${data.get('destinazione') || 'Da definire'}`,
      `Partenza: ${data.get('partenza') || 'Da definire'}`,
      `Viaggiatori: ${data.get('viaggiatori') || 'Da definire'}`,
      `Servizio: ${data.get('servizio') || 'Da definire'}`,
      '',
      String(data.get('messaggio') || '')
    ].join('\n');

    window.location.href = `mailto:elisa.exploreworld@gmail.com?subject=${encodeURIComponent('Parliamo del mio viaggio')}&body=${encodeURIComponent(body)}`;
  });

  const bioDialog = document.getElementById('bio-dialog');
  document.querySelector('.bio-more-button')?.addEventListener('click', () => bioDialog?.showModal());
  document.querySelectorAll('[data-dialog-close]').forEach(button => {
    button.addEventListener('click', () => button.closest('dialog')?.close());
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
    });
  });
})();
