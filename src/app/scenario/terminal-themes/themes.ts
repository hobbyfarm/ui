import Hobbyfarm_Default from './Hobbyfarm_Default';
import Solarized_Light from './Solarized_Light';
import Solarized_Dark from './Solarized_Dark';
import Solarized_Dark_Higher_Contrast from './Solarized_Dark_Higher_Contrast';
import GitHub from './GitHub';
import Dichromatic from './Dichromatic';

//Themes taken from https://github.com/ysk2014/xterm-theme
const availableThemes = [
    {'theme': 'default', 'name': 'Default Hobbyfarm Terminal', 'styles': Hobbyfarm_Default},
    {'theme': 'Solarized_Light', 'name': 'Solarized Light', 'styles': Solarized_Light},
    {'theme': 'Solarized_Dark', 'name': 'Solarized Dark', 'styles': Solarized_Dark},
    {'theme': 'Solarized_Dark_Higher_Contrast', 'name': 'Solarized Dark Higher Contrast', 'styles': Solarized_Dark_Higher_Contrast },
    {'theme': 'GitHub', 'name': 'GitHub', 'styles': GitHub },
    {'theme': 'Dichromatic', 'name': 'Dichromatic', 'styles': Dichromatic }
];

export {availableThemes};
export default {availableThemes};