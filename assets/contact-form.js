document.addEventListener(
  'submit',
  async (evt) => {
    if (!evt.target.matches('form.g-container[data-id="62733"]')) return;

    let gclid, wbraid

    const urlParams = new URLSearchParams(window.location.search); 
    const gclidParam = urlParams.get('gclid');
    const wbraidParam = urlParams.get('wbraid');

    if (gclidParam) {
      gclid = gclidParam
    } else {
      gclid = sessionStorage.getItem('gclid');
    }

    if (wbraidParam) {
      wbraid = wbraidParam
    } else {
      wbraid = sessionStorage.getItem('wbraid');
    }

    evt.preventDefault();
    evt.stopPropagation();

    const fd     = new FormData(evt.target);
    const email  = (fd.get('email') || '').trim();          
    const isMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); 

    if (!isMail) {
      const errorBanner = document.querySelector('.message.error');
      if (errorBanner) {
        errorBanner.querySelector('.content').textContent =
          'Please enter a valid e-mail address.';
        errorBanner.style.display = 'block';
        errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return; 
    }

    try {
      const res = await fetch(
        'https://fitnesssuperstore-api.azurewebsites.net/api/email/shopifycontactformsubmit',
        { method: 'POST', body: fd }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const { success } = await res.json();
      if (!success) throw new Error('API returned success:false');
      let googleSheetData = {
        datetime: new Date(),
        gclid: gclid,
        wbraid: wbraid,
        name: fd.get('text-1'),
        phone: fd.get('phone-1'),
        email: fd.get('email'),
        message: fd.get('textarea')
      }

      await postToGoogleSheet(googleSheetData);
      evt.target.reset(); 
      Globo.FormBuilder.initialize();   
      setTimeout(() => {
        const successBanner = document.querySelector('.message.success');
        if (successBanner) successBanner.style.display = 'block';
      });
    } catch (err) {
      const errorBanner = document.querySelector('.message.error');
      if (errorBanner) {
        errorBanner.querySelector('.content').textContent =
          'Something went wrong, please try again.';
        errorBanner.style.display = 'block';
      }
    }
  },
  true 
);

async function postToGoogleSheet(data) {
  return fetch(
    'https://script.google.com/macros/s/AKfycbxBUc8G1rq-5pYsYk3KlJhYo_al0CJ0aZq654vD3P0isoijnjIz2oldyvnuGjMhL965DQ/exec',
    { method: 'POST', body: data }
  );
}