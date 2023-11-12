
const handleProfileCardFocusIn = (event) => {
    if (event.target.classList.contains('color')) {
        let parentWrapper = event.target.closest('.colorWrapper');
        if (parentWrapper) {
            let colorBehind = parentWrapper.querySelector('.colorBehind');
            if (colorBehind) {
                colorBehind.setAttribute("style", "border: 1px solid #74f3ed;");
                colorBehind.classList.add('focused');
            }
        }
    } else if (event.target.classList.contains('material-icons') || event.target.classList.contains('material-symbols-outlined')) {
        event.target.setAttribute("style", "border: 1px solid #74f3ed;");
        event.target.classList.add('focused');
    }
};

const handleProfileCardFocusOut = (event) => {
    if (event.target.classList.contains('color')) {
        let parentWrapper = event.target.closest('.colorWrapper');
        if (parentWrapper) {
            let colorBehind = parentWrapper.querySelector('.colorBehind');
            if (colorBehind) {
                colorBehind.setAttribute("style", "border: 1px solid transparent;");
                colorBehind.classList.remove('focused');
            }
        }
    } else if (event.target.classList.contains('material-icons') || event.target.classList.contains('material-symbols-outlined')) {
        event.target.setAttribute("style", "border: 1.5px solid transparent;");
        event.target.classList.remove('focused');
    }
};

const handleProfileCardClick = (event) => {
if (event.target.classList.contains('color')) {
        document.querySelectorAll('.colorGroup .colors .colorBehind').forEach(el => el.classList.remove('selected'));
        let parentWrapper = event.target.closest('.colorWrapper');
        if (parentWrapper) {
            let colorBehind = parentWrapper.querySelector('.colorBehind');
            if (colorBehind) {
                colorBehind.classList.add('selected');
            }
        }
    } else if (event.target.classList.contains('material-icons') || event.target.classList.contains('material-symbols-outlined')) {
        document.querySelectorAll('.iconGroup .icons .material-icons, .iconGroup .icons .material-symbols-outlined').forEach(el => el.classList.remove('selected'));
        event.target.classList.add('selected');
    }
};

export { handleProfileCardFocusIn, handleProfileCardFocusOut, handleProfileCardClick };