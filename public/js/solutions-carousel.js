(() => {
    const carousel = document.querySelector("[data-capability-carousel]");
    if (!carousel) return;

    const stage = carousel.querySelector(".capability-stage");
    const cards = [...carousel.querySelectorAll(".solution-capability-card")];
    const dotsWrap = carousel.querySelector(".capability-pagination");
    const liveRegion = carousel.querySelector(".capability-live");
    const previousButton = carousel.querySelector("[data-capability-prev]");
    const nextButton = carousel.querySelector("[data-capability-next]");
    if (
        !stage ||
        cards.length < 2 ||
        !dotsWrap ||
        !previousButton ||
        !nextButton
    )
        return;

    let currentIndex = 0;
    let pointerStart = null;
    let suppressClick = false;
    const dots = cards.map((card, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "capability-dot";
        dot.setAttribute(
            "aria-label",
            `Hiện chức năng ${index + 1}: ${card.querySelector("h3")?.textContent.trim() || "LANDIFORM"}`,
        );
        dot.addEventListener("click", () => showCard(index));
        dotsWrap.append(dot);
        return dot;
    });

    function showCard(index) {
        currentIndex = (index + cards.length) % cards.length;
        cards.forEach((card, cardIndex) => {
            const offset =
                (cardIndex - currentIndex + cards.length) % cards.length;
            const state =
                offset === 0
                    ? "current"
                    : offset === 1
                      ? "next"
                      : offset === cards.length - 1
                        ? "previous"
                        : "hidden";
            card.classList.remove(
                "is-current",
                "is-next",
                "is-previous",
                "is-hidden",
            );
            card.classList.add(`is-${state}`);
            card.setAttribute(
                "aria-hidden",
                state === "hidden" ? "true" : "false",
            );
            card.inert = state === "hidden";
        });
        dots.forEach((dot, dotIndex) => {
            const active = dotIndex === currentIndex;
            dot.classList.toggle("is-current", active);
            if (active) dot.setAttribute("aria-current", "true");
            else dot.removeAttribute("aria-current");
        });
        const title = cards[currentIndex]
            .querySelector("h3")
            ?.textContent.trim();
        if (liveRegion)
            liveRegion.textContent = `Chức năng ${currentIndex + 1} trên ${cards.length}: ${title || "LANDIFORM"}`;
    }

    previousButton.addEventListener("click", () => showCard(currentIndex - 1));
    nextButton.addEventListener("click", () => showCard(currentIndex + 1));
    stage.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            showCard(currentIndex - 1);
        }
        if (event.key === "ArrowRight") {
            event.preventDefault();
            showCard(currentIndex + 1);
        }
    });
    stage.addEventListener("pointerdown", (event) => {
        pointerStart = { x: event.clientX, y: event.clientY };
    });
    stage.addEventListener("pointerup", (event) => {
        if (!pointerStart) return;
        const deltaX = event.clientX - pointerStart.x;
        const deltaY = event.clientY - pointerStart.y;
        pointerStart = null;
        if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25)
            return;
        showCard(currentIndex + (deltaX < 0 ? 1 : -1));
        suppressClick = true;
        window.setTimeout(() => {
            suppressClick = false;
        }, 0);
    });
    stage.addEventListener("pointercancel", () => {
        pointerStart = null;
    });
    stage.addEventListener(
        "click",
        (event) => {
            if (!suppressClick) return;
            event.preventDefault();
            event.stopPropagation();
            suppressClick = false;
        },
        true,
    );

    showCard(currentIndex);
})();
