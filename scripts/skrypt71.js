var skrypt7 = (v) => {
    if (v == null) throw new Error("it's a null");
    return v;
}

function injectCode(src) {
    const script = document.createElement('script');
    // This is why it works!
    script.src = src;
    script.onload = function() {
        this.remove();
    };

    // This script runs before the <head> element is created,
    // so we add the script to <html> instead.
    skrypt7(document.head || document.documentElement).appendChild(script);
}


injectCode(chrome.runtime.getURL('scripts/skrypt7.js'));