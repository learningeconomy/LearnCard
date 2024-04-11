import coins from '../assets/images/coins.svg';
import user from '../assets/images/user.svg';
import trophy from '../assets/images/trophy.svg';
import briefcase from '../assets/images/briefcase.svg';
import graduation from '../assets/images/graduation.svg';
import lightbulb from '../assets/images/lightbulb.svg';
import award from '../assets/images/award.svg';
import keyIcon from '../assets/images/key-icon.svg';

import puzzlelight from '../assets/images/minipuzzle.svg';
import trophylight from '../assets/images/minitrophy.svg';
import gradcaplight from '../assets/images/gradcaplight.svg';

// new icons
import idIcon from '../assets/icons/idIcon.svg';
import coursesIcon from '../assets/icons/coursesIcon.svg';
import socialBadgesIcon from '../assets/icons/socialBadgesIcon.svg';
import achievementsIcon from '../assets/icons/achievementsIcon.svg';
import accomplishmentsIcon from '../assets/icons/accomplishmentsIcon.svg';
import skillsIcon from '../assets/icons/skillsIcon.svg';
import experiencesIcon from '../assets/icons/experiencesIcon.svg';
import relationshipsIcon from '../assets/icons/relationshipsIcon.svg';
import accommodationsIcon from '../assets/icons/accommodationsIcon.svg';
import membershipsIcon from '../assets/icons/membershipsIcon.svg';
import goalsIcon from '../assets/icons/goalsIcon.svg';
import eventsIcon from '../assets/icons/eventsIcon.svg';

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
    award,
    keyIcon,

    // new icons
    coursesIcon,
    socialBadgesIcon,
    achievementsIcon,
    accomplishmentsIcon,
    skillsIcon,
    experiencesIcon,
    relationshipsIcon,
    accommodationsIcon,
    membershipsIcon,
    goalsIcon,
    eventsIcon,
};

export const ICONS_TO_SOURCE = {
    [Icons.coinsIcon]: coins,
    [Icons.userIcon]: idIcon,
    [Icons.trophyIcon]: trophy,
    [Icons.briefcaseIcon]: briefcase,
    [Icons.graduationIcon]: graduation,
    [Icons.lightbulbIcon]: lightbulb,
    [Icons.puzzlelight]: puzzlelight,
    [Icons.trophylight]: trophylight,
    [Icons.gradcaplight]: gradcaplight,
    [Icons.award]: award,
    [Icons.keyIcon]: keyIcon,

    // new icons
    [Icons.coursesIcon]: coursesIcon,
    [Icons.socialBagesIcon]: socialBadgesIcon,
    [Icons.achievementsIcon]: achievementsIcon,
    [Icons.accomplishmentsIcon]: accomplishmentsIcon,
    [Icons.skillsIcon]: skillsIcon,
    [Icons.experiencesIcon]: experiencesIcon,
    [Icons.relationshipsIcon]: relationshipsIcon,
    [Icons.accommodationsIcon]: accommodationsIcon,
    [Icons.membershipsIcon]: membershipsIcon,
    [Icons.goalsIcon]: goalsIcon,
    [Icons.eventsIcon]: eventsIcon,
};

export const TYPE_TO_ICON: any = {
    course: gradcaplight,
    achievement: trophylight,
    skill: puzzlelight,
};
