import coins from '../assets/images/coins.svg';
import user from '../assets/images/user.svg';
import trophy from '../assets/images/trophy.svg';
import briefcase from '../assets/images/briefcase.svg';
import graduation from '../assets/images/graduation.svg';
import lightbulb from '../assets/images/lightbulb.svg';

import puzzlelight from '../assets/images/minipuzzle.svg';
import trophylight from '../assets/images/minitrophy.svg';
import gradcaplight from '../assets/images/gradcaplight.svg';

import { Icons } from '../types';
export {
    coins,
    user,
    trophy,
    briefcase,
    graduation,
    lightbulb,
    gradcaplight,
    trophylight,
    puzzlelight,
};

export const ICONS_TO_SOURCE = {
    [Icons.coinsIcon]: coins,
    [Icons.userIcon]: user,
    [Icons.trophyIcon]: trophy,
    [Icons.briefcaseIcon]: briefcase,
    [Icons.graduationIcon]: graduation,
    [Icons.lightbulbIcon]: lightbulb,
    [Icons.puzzlelight]: puzzlelight,
    [Icons.trophylight]: trophylight,
    [Icons.gradcaplight]: gradcaplight,
};

export const TYPE_TO_ICON: any = {
    course: puzzlelight,
    achievement: trophylight,
    skill: puzzlelight,
};
