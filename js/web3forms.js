/* Sends the site's forms to Web3Forms with fetch so visitors stay on the page.
   Listens in the capture phase on window, so it runs before (and stops) Webflow's
   own delegated submit handler. Shows the existing .w-form-done / .w-form-fail messages. */
(function () {
  var ENDPOINT = 'https://api.web3forms.com/submit';

  function wrapperOf(form) {
    var el = form.parentNode;
    while (el && el !== document && !(el.classList && el.classList.contains('w-form'))) el = el.parentNode;
    return el && el !== document ? el : form.parentNode;
  }

  function findMsg(wrapper, cls) {
    for (var i = 0; i < wrapper.children.length; i++) {
      if (wrapper.children[i].classList.contains(cls)) return wrapper.children[i];
    }
    return wrapper.querySelector('.' + cls);
  }

  window.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.matches || !form.matches('form[data-web3forms]')) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (form.getAttribute('data-sending') === '1') return;

    var wrapper = wrapperOf(form);
    var done = findMsg(wrapper, 'w-form-done');
    var fail = findMsg(wrapper, 'w-form-fail');
    var button = form.querySelector('input[type="submit"], button[type="submit"], button:not([type])');
    var label = button ? (button.tagName === 'INPUT' ? button.value : button.textContent) : '';
    var wait = button && button.getAttribute('data-wait');

    function setLabel(text) {
      if (!button || !text) return;
      if (button.tagName === 'INPUT') button.value = text; else button.textContent = text;
    }

    form.setAttribute('data-sending', '1');
    if (fail) fail.style.display = 'none';
    setLabel(wait);

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new FormData(form)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok || !data.success) throw new Error(data.message || 'Submission failed');
        });
      })
      .then(function () {
        form.reset();
        form.style.display = 'none';
        if (done) done.style.display = 'block';
      })
      .catch(function () {
        if (fail) fail.style.display = 'block';
      })
      .then(function () {
        form.removeAttribute('data-sending');
        setLabel(label);
      });
  }, true);
})();
