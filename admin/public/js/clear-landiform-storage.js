(() => {
    const prefix = "landiform.";
    ["localStorage", "sessionStorage"].forEach((name) => {
        try {
            const store = window[name];
            const keys = [];
            for (let index = 0; index < store.length; index += 1) {
                const key = store.key(index);
                if (key?.startsWith(prefix)) keys.push(key);
            }
            keys.forEach((key) => store.removeItem(key));
        } catch {
            // Continue loading the page if browser storage is unavailable.
        }
    });
})();
