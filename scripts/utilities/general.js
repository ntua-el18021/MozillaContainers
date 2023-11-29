import {views} from '../mainPopup/popup.js';
import {profileForHistory} from '../utilities/historyView.js';

export async function handleGoToView(viewToShow) {
    if (viewToShow === "historyPageView") {
        console.log('Loading history view...');
        await profileForHistory();
        console.log('History view loaded');
    }
    // Iterate over each view
    Object.entries(views).forEach(([key, view]) => {
        view.style.display = (key === viewToShow) ? 'block' : 'none';
    });
}