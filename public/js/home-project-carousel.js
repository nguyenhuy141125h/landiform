document.querySelectorAll("[data-project-carousel]").forEach((carousel) => {
    const rail = carousel.querySelector(".home-project-grid");
    if (!rail) return;

    const originals = [...rail.children];
    if (originals.length < 2) return;

    let cloneSets = 0;

    const makeClone = (item) => {
        const clone = item.cloneNode(true);
        clone.dataset.carouselClone = "true";
        clone.setAttribute("aria-hidden", "true");
        clone
            .querySelectorAll("a, button, input, select, textarea, [tabindex]")
            .forEach((node) => {
                node.setAttribute("tabindex", "-1");
            });
        return clone;
    };

    const addCloneSets = (count) => {
        const before = [];
        const after = [];
        for (let set = 0; set < count; set += 1) {
            originals.forEach((item) => before.push(makeClone(item)));
            originals.forEach((item) => after.push(makeClone(item)));
        }
        rail.prepend(...before);
        rail.append(...after);
        cloneSets += count;
    };

    const getContentLeft = (item) =>
        item.getBoundingClientRect().left -
        rail.getBoundingClientRect().left +
        rail.scrollLeft;
    let originalStart = 0;
    let advance = 0;
    const measure = () => {
        const style = getComputedStyle(rail);
        const gap = parseFloat(style.columnGap) || parseFloat(style.gap) || 0;
        const firstRect = originals[0].getBoundingClientRect();
        const lastRect =
            originals[originals.length - 1].getBoundingClientRect();
        advance = lastRect.right - firstRect.left + gap;
        originalStart =
            getContentLeft(originals[0]) -
            rail.clientLeft -
            (parseFloat(style.paddingLeft) || 0);
    };

    measure();
    addCloneSets(Math.max(2, Math.ceil(rail.clientWidth / advance) + 1));
    measure();
    let startScroll = originalStart;
    let activePointer = null;
    let startX = 0;
    let lastX = 0;
    let lastTime = 0;
    let velocity = 0;
    let moved = false;
    let suppressClickUntil = 0;
    let adjusting = false;
    let momentumFrame = 0;

    const normalizeLoop = () => {
        if (adjusting) return;
        let shift = 0;
        if (rail.scrollLeft < originalStart - advance) shift = advance;
        else if (rail.scrollLeft >= originalStart + advance) shift = -advance;
        if (!shift) return;

        adjusting = true;
        rail.classList.add("is-repositioning");
        rail.scrollLeft += shift;
        if (activePointer !== null) startScroll += shift;
        window.requestAnimationFrame(() => {
            rail.classList.remove("is-repositioning");
            adjusting = false;
        });
    };

    const coast = () => {
        rail.scrollLeft += velocity * 16;
        velocity *= 0.94;
        if (Math.abs(velocity) > 0.015) {
            momentumFrame = window.requestAnimationFrame(coast);
            return;
        }
        rail.classList.remove("is-momentum");
    };

    rail.addEventListener("scroll", normalizeLoop, { passive: true });
    let resizeFrame = 0;
    window.addEventListener("resize", () => {
        window.cancelAnimationFrame(resizeFrame);
        resizeFrame = window.requestAnimationFrame(() => {
            measure();
            const neededSets = Math.max(
                2,
                Math.ceil(rail.clientWidth / advance) + 1,
            );
            if (neededSets > cloneSets) addCloneSets(neededSets - cloneSets);
            measure();
            rail.classList.add("is-repositioning");
            rail.scrollLeft = originalStart;
            window.requestAnimationFrame(() =>
                rail.classList.remove("is-repositioning"),
            );
        });
    });

    rail.addEventListener("pointerdown", (event) => {
        if (event.pointerType !== "mouse" || event.button !== 0) return;
        window.cancelAnimationFrame(momentumFrame);
        rail.classList.remove("is-momentum");
        activePointer = event.pointerId;
        moved = false;
        startX = lastX = event.clientX;
        startScroll = rail.scrollLeft;
        lastTime = performance.now();
        velocity = 0;
    });

    rail.addEventListener("pointermove", (event) => {
        if (event.pointerId !== activePointer) return;
        const distance = event.clientX - startX;
        if (Math.abs(distance) > 3 && !moved) {
            moved = true;
            rail.setPointerCapture(event.pointerId);
        }
        if (!moved) return;

        rail.classList.add("is-dragging");
        rail.scrollLeft = startScroll - distance;
        const now = performance.now();
        const elapsed = Math.max(1, now - lastTime);
        velocity = -(event.clientX - lastX) / elapsed;
        lastX = event.clientX;
        lastTime = now;
        event.preventDefault();
    });

    const finishDrag = (event) => {
        if (event.pointerId !== activePointer) return;
        activePointer = null;
        rail.classList.remove("is-dragging");
        if (!moved) return;

        suppressClickUntil = performance.now() + 250;
        if (Math.abs(velocity) > 0.04) {
            rail.classList.add("is-momentum");
            momentumFrame = window.requestAnimationFrame(coast);
        }
    };

    rail.addEventListener("pointerup", finishDrag);
    rail.addEventListener("pointercancel", finishDrag);
    rail.addEventListener(
        "click",
        (event) => {
            if (performance.now() > suppressClickUntil) return;
            event.preventDefault();
            event.stopImmediatePropagation();
        },
        true,
    );

    rail.scrollLeft = originalStart;
});
