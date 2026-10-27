(() => {
    // The customer site is a static prototype. Keep submitted data in the form
    // and expose an event for a future API adapter instead of faking success.
    document.addEventListener("submit", (event) => {
        const form = event.target;
        if (!(form instanceof HTMLFormElement) || form.hasAttribute("data-backend-submit")) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        form.dispatchEvent(new CustomEvent("landiform:backend-submit", {
            bubbles: true,
            detail: { form, values: new FormData(form) },
        }));
    }, true);
})();
