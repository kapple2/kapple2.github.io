// KAPPLE ][ : loads the ][ family emulator (main2.bundle.js) or the //e one (main2e.bundle.js).
// The choice is the model ("기종") of the options window, kept as the preference computer_type2 (or ?computer_type2=apple2e
// in the address). It sits in dist\ next to the two bundles; the page loads it instead of main2.bundle.js.
(function () {
    var E = ['apple2enh', 'apple2e', 'apple2rm', 'apple2ex'];
    var model = '';
    try {
        model = new URLSearchParams(window.location.search).get('computer_type2') || window.localStorage.getItem('computer_type2') || '';
    } catch (e) { /* no storage: the default */ }
    var isE = E.indexOf(model) >= 0;
    if (isE) {   // the //e key layout and its styles are under body.apple2e
        document.body.classList.remove('apple2');
        document.body.classList.add('apple2e');
    }
    var base = document.currentScript.src.replace(/[^/]*$/, '');
    document.write('<script src="' + base + (isE ? 'main2e' : 'main2') + '.bundle.js"><\/script>');
})();
