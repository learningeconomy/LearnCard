import { LearnCardRolesEnum } from '../onboarding.helpers';

import LearnerIcon from '../../../assets/images/quicknavroles/learnergradcapicon.png';
import GuardianIcon from '../../../assets/images/quicknavroles/guardianhomeicon.png';
import TeacherIcon from '../../../assets/images/quicknavroles/teacherappleicon.png';
import AdminIcon from '../../../assets/images/quicknavroles/adminshieldicon.png';
import DeveloperIcon from '../../../assets/images/quicknavroles/developeralienicon.png';

import adminSlide1 from './onboardingRolesSlidesImages/admin-slide1.png';
import adminSlide2 from './onboardingRolesSlidesImages/admin-slide2.png';
import adminSlide3 from './onboardingRolesSlidesImages/admin-slide3.png';
import adminSlide4 from './onboardingRolesSlidesImages/admin-slide4.png';

import developerSlide1 from './onboardingRolesSlidesImages/developer-slide1.png';
import developerSlide2 from './onboardingRolesSlidesImages/developer-slide2.png';
import developerSlide3 from './onboardingRolesSlidesImages/developer-slide3.png';
import developerSlide4 from './onboardingRolesSlidesImages/developer-slide4.png';

import learnerSlide1 from './onboardingRolesSlidesImages/learner-slide1.png';
import learnerSlide2 from './onboardingRolesSlidesImages/learner-slide2.png';
import learnerSlide3 from './onboardingRolesSlidesImages/learner-slide3.png';
import learnerSlide4 from './onboardingRolesSlidesImages/learner-slide4.png';

import guardianSlide1 from './onboardingRolesSlidesImages/guardian-slide1.png';
import guardianSlide2 from './onboardingRolesSlidesImages/guardian-slide2.png';
import guardianSlide3 from './onboardingRolesSlidesImages/guardian-slide3.png';
import guardianSlide4 from './onboardingRolesSlidesImages/guardian-slide4.png';

import teacherSlide1 from './onboardingRolesSlidesImages/teacher-slide1.png';
import teacherSlide2 from './onboardingRolesSlidesImages/teacher-slide2.png';
import teacherSlide3 from './onboardingRolesSlidesImages/teacher-slide3.png';
import teacherSlide4 from './onboardingRolesSlidesImages/teacher-slide4.png';

export type SlideContent = {
    boldText: string;
    regularText: string;
    over13Text?: string;
    image: string;
    imageAlt: string;
};

export type RoleSlideConfig = {
    icon: string;
    iconBgColor: string;
    bgColor: string;
    slides: SlideContent[];
};

export const roleSlideContent: Partial<Record<LearnCardRolesEnum, RoleSlideConfig>> = {
    [LearnCardRolesEnum.learner]: {
        icon: LearnerIcon,
        iconBgColor: '#99F6E4', // teal-200
        bgColor: 'bg-teal-50',
        slides: [
            {
                boldText: 'Capture',
                regularText: 'your learning wherever it happens',
                over13Text: 'your learning & work experiences',
                image: learnerSlide1,
                imageAlt: 'Achievement page with credentials',
            },
            {
                boldText: 'Collect',
                regularText: 'your education experiences in your Passport',
                image: learnerSlide2,
                imageAlt: 'Passport page',
            },
            {
                boldText: 'Learn',
                regularText: 'about your Skills & Experiences',
                image: learnerSlide3,
                imageAlt: 'AI Insights Hub',
            },
            {
                boldText: 'Level up',
                regularText: 'your learning with a growing suite of AI Tutors',
                image: learnerSlide4,
                imageAlt: 'AI session summary',
            },
        ],
    },
    [LearnCardRolesEnum.guardian]: {
        icon: GuardianIcon,
        iconBgColor: '#DDD6FE', // violet-200
        bgColor: 'bg-violet-50',
        slides: [
            {
                boldText: 'Guide your child',
                regularText: 'through learning experiences',
                image: guardianSlide1,
                imageAlt: '',
            },
            {
                boldText: 'Safeguard',
                regularText: "your child's privacy with secure, consent based data tools",
                image: guardianSlide2,
                imageAlt: 'Privacy and data page',
            },
            {
                boldText: 'Enhance',
                regularText: "your child's learning with AI tutors and learning apps",
                image: guardianSlide3,
                imageAlt: 'App page',
            },
            {
                boldText: 'Gain insights',
                regularText: "into your child's learning journey",
                image: guardianSlide4,
                imageAlt: 'AI insights hub',
            },
        ],
    },
    [LearnCardRolesEnum.teacher]: {
        icon: TeacherIcon,
        iconBgColor: '#FEF3C7', // amber-100
        bgColor: 'bg-amber-50',
        slides: [
            {
                boldText: 'Organize all your students & learning data',
                regularText: 'in one dashboard',
                image: teacherSlide1,
                imageAlt: 'AI Insights Hub for teachers',
            },
            {
                boldText: 'Create and manage',
                regularText: 'customized credentials',
                image: teacherSlide2,
                imageAlt: 'Issuing credentials',
            },
            {
                boldText: 'Award',
                regularText: 'learners with real, high-fidelity proof of learning experiences',
                image: teacherSlide3,
                imageAlt: 'Badge',
            },
            {
                boldText: 'Assess',
                regularText: "your student's progress in real time",
                image: teacherSlide4,
                imageAlt: 'Student progress',
            },
        ],
    },
    [LearnCardRolesEnum.admin]: {
        icon: AdminIcon,
        iconBgColor: '#CFFAFE', // cyan-100
        bgColor: 'bg-cyan-50',
        slides: [
            {
                boldText: 'Create',
                regularText: 'skills frameworks and credentials',
                image: adminSlide1,
                imageAlt: 'Skills frameworks',
            },
            {
                boldText: 'Organize',
                regularText: 'your learners, teachers, and learning experiences',
                image: adminSlide2,
                imageAlt: 'Admin dashboard',
            },
            {
                boldText: 'Distribute',
                regularText: 'your learning materials in one easy-to-use app',
                image: adminSlide3,
                imageAlt: 'Bulk import credentials',
            },
            {
                boldText: 'Manage',
                regularText: 'advanced tools and settings for data sharing and more',
                image: adminSlide4,
                imageAlt: 'Admin tools',
            },
        ],
    },
    [LearnCardRolesEnum.developer]: {
        icon: DeveloperIcon,
        iconBgColor: '#BEF264', // lime-300
        bgColor: 'bg-lime-50',
        slides: [
            {
                boldText: 'Configure',
                regularText: 'issuers, consent protocols and connected systems',
                image: developerSlide1,
                imageAlt: 'Signing Authorities',
            },
            {
                boldText: 'Integrate',
                regularText: 'with schools, applications, and data sources',
                image: developerSlide2,
                imageAlt: 'API token',
            },
            {
                boldText: 'Manage',
                regularText: 'your end-to-end data flow',
                image: developerSlide3,
                imageAlt: 'Create Consent Flow Contracts',
            },
            {
                boldText: 'Design',
                regularText: 'custom, modular user experiences',
                image: developerSlide4,
                imageAlt: 'Create your own app',
            },
        ],
    },
};

const defaultConfig = roleSlideContent[LearnCardRolesEnum.learner]!;

export const getSlideContent = (
    role: LearnCardRolesEnum,
    slideIndex: number
): SlideContent & { icon: string; iconBgColor: string; bgColor: string } => {
    const config = roleSlideContent[role] ?? defaultConfig;
    const slide = config.slides[slideIndex] ?? config.slides[0];

    return {
        ...slide,
        icon: config.icon,
        iconBgColor: config.iconBgColor,
        bgColor: config.bgColor,
    };
};
