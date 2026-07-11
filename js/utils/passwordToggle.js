const initializePasswordToggle = () => {
    const toggles = document.querySelectorAll(".eye-toggle");

    toggles.forEach((toggle) => {
        const input = toggle.parentElement.querySelector("input");

        if (!input) return;

        toggle.addEventListener("click", () => {
            const isVisible = input.type === "text";
            input.type = isVisible ? "password" : "text";
            toggle.classList.toggle("eye-toggle--visible", !isVisible);
            toggle.setAttribute(
                "aria-label",
                isVisible ? "Show password" : "Hide password"
            );
        });
    });
};

export default initializePasswordToggle;
