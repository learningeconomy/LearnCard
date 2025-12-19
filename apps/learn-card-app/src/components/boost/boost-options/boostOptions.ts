import React from 'react';
import { z } from 'zod';

import ExperienceIcon from 'learn-card-base/svgs/ExperienceIcon';
import AccommodationsIcon from 'learn-card-base/svgs/AccommodationsIcon';

import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import BoostsIcon from 'learn-card-base/svgs/wallet/BoostsIcon';
import AllBoostsIcon from 'learn-card-base/svgs/wallet/AllBoostsIcon';
import AchievementsIcon from 'learn-card-base/svgs/wallet/AchievementsIcon';
import PortfolioIcon from 'learn-card-base/svgs/wallet/PortfolioIcon';
import StudiesIcon from 'learn-card-base/svgs/wallet/StudiesIcon';
import AssistanceIcon from 'learn-card-base/svgs/wallet/AssistanceIcon';
import ExperiencesIcon from 'learn-card-base/svgs/wallet/ExperiencesIcon';
import IDsIcon from 'learn-card-base/svgs/wallet/IDsIcon';
import { BoostCategoryOptionsEnum, Shapes } from 'learn-card-base';

const { Square, Circle, Triangle, Diamond, Hexagon, Kite } = Shapes;

export const availableBoostCategories = [
    BoostCategoryOptionsEnum.all,
    BoostCategoryOptionsEnum.socialBadge,
    BoostCategoryOptionsEnum.achievement,
    BoostCategoryOptionsEnum.learningHistory,
    BoostCategoryOptionsEnum.accomplishment,
    BoostCategoryOptionsEnum.accommodation,
    BoostCategoryOptionsEnum.workHistory,
    BoostCategoryOptionsEnum.id,
];

export enum BoostUserTypeEnum {
    self = 'self',
    someone = 'someone',
}

// ! MUST ALIGN WITH -> learn-card-base/src/helpers -> credentialHelpers.ts -> { CATEGORY_MAP }
// ! MUST ALIGN WITH -> learn-card-base/src/components/issueVC -> constants.ts -> { AchievementTypes }
export const boostVCTypeOptions = {
    [BoostUserTypeEnum.self]: [
        {
            id: 1,
            title: 'Boosts',
            IconComponent: BoostsIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-blue-500',
            type: BoostCategoryOptionsEnum.socialBadge,
        },
        // {
        //     id: 2,
        //     title: 'Skill',
        //     IconComponent: PuzzlePiece,
        //     iconClassName: 'text-white',
        //     iconCircleClass: 'bg-indigo-600',
        //     type: BoostCategoryOptionsEnum.skill,
        // },
        {
            id: 3,
            title: 'Achievement',
            IconComponent: AchievementsIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-pink-400',
            type: BoostCategoryOptionsEnum.achievement,
        },
        {
            id: 4,
            title: 'Studies',
            IconComponent: StudiesIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-emerald-500',
            type: BoostCategoryOptionsEnum.learningHistory,
        },
        {
            id: 8,
            title: 'Portfolio',
            IconComponent: PortfolioIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-yellow-400',
            type: BoostCategoryOptionsEnum.accomplishment,
        },
        {
            id: 9,
            title: 'Accommodation',
            IconComponent: AccommodationsIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-violet-400',
            type: BoostCategoryOptionsEnum.accommodation,
        },
        {
            id: 6,
            title: 'Experiences',
            IconComponent: ExperienceIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-blue-600',
            type: BoostCategoryOptionsEnum.workHistory,
        },
        {
            id: 5,
            title: 'ID',
            IconComponent: IDsIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-blue-400',
            type: BoostCategoryOptionsEnum.id,
        },
        // {
        //     id: 9,
        //     title: 'Families',
        //     IconComponent: FamilyIcon,
        //     iconClassName: 'text-white',
        //     iconCircleClass: 'bg-pink-600',
        //     type: BoostCategoryOptionsEnum.family,
        // },
        // {
        //     id: 7,
        //     title: 'Membership',
        //     IconComponent: KeyIcon,
        //     iconClassName: 'text-white',
        //     iconCircleClass: 'bg-teal-400',
        //     type: BoostCategoryOptionsEnum.membership,
        // },
    ],
    [BoostUserTypeEnum.someone]: [
        {
            id: 0,
            title: 'All',
            IconComponent: AllBoostsIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-indigo-500',
            type: BoostCategoryOptionsEnum.all,
            WalletIcon: AllBoostsIcon,
            iconStyles: 'h-[35px] w-[35px]',
        },
        {
            id: 1,
            title: 'Boosts',
            IconComponent: BoostsIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-blue-500',
            ShapeIcon: Kite,
            WalletIcon: BoostsIcon,
            shapeColor: 'text-[#93C5FD] w-[35px] h-[35px]',
            iconStyles: 'h-[35px] w-[35px]',
            type: BoostCategoryOptionsEnum.socialBadge,
        },
        // {
        //     id: 2,
        //     title: 'Skill',
        //     IconComponent: PuzzlePiece,
        //     iconClassName: 'text-white',
        //     iconCircleClass: 'bg-indigo-600',
        //     type: BoostCategoryOptionsEnum.skill,
        // },
        {
            id: 3,
            title: 'Achievement',
            IconComponent: AchievementsIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-pink-400',
            type: BoostCategoryOptionsEnum.achievement,
            ShapeIcon: Diamond,
            shapeColor: 'text-pink-300',
            iconStyles: 'h-[35px] w-[35px]',
            WalletIcon: AchievementsIcon,
        },
        {
            id: 4,
            title: 'Studies',
            IconComponent: StudiesIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-emerald-500',
            type: BoostCategoryOptionsEnum.learningHistory,
            ShapeIcon: Hexagon,
            shapeColor: 'text-emerald-500 w-[35px] h-[35px]',
            iconStyles: 'h-[30px] w-[30px]',
            WalletIcon: StudiesIcon,
        },
        {
            id: 8,
            title: 'Portfolio',
            IconComponent: PortfolioIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-yellow-400',
            type: BoostCategoryOptionsEnum.accomplishment,
            ShapeIcon: Triangle,
            shapeColor: 'text-yellow-300 rotate-180 w-[35px] h-[35px]',
            iconStyles: 'h-[35px] w-[35px]',
            WalletIcon: PortfolioIcon,
        },
        {
            id: 9,
            title: 'Assistance',
            IconComponent: AssistanceIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-violet-400',
            type: BoostCategoryOptionsEnum.accommodation,
            ShapeIcon: Square,
            shapeColor: 'text-violet-400 w-[110px] h-[110px]',
            iconStyles: 'h-[28px] w-[28px]',
            WalletIcon: AssistanceIcon,
        },
        {
            id: 6,
            title: 'Experiences',
            IconComponent: ExperiencesIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-cyan-400',
            type: BoostCategoryOptionsEnum.workHistory,
            ShapeIcon: Circle,
            shapeColor: 'text-cyan-400 w-[35px] h-[35px]',
            WalletIcon: ExperiencesIcon,
            iconStyles: 'h-[35px] w-[35px] !top-[46%]',
        },
        // {
        //     id: 7,
        //     title: 'Membership',
        //     IconComponent: KeyIcon,
        //     iconClassName: 'text-white',
        //     iconCircleClass: 'bg-teal-400',
        //     type: BoostCategoryOptionsEnum.membership,
        // },
        // {
        //     id: 9,
        //     title: 'Families',
        //     IconComponent: FamilyIcon,
        //     iconClassName: 'text-white',
        //     iconCircleClass: 'bg-pink-600',
        //     type: BoostCategoryOptionsEnum.family,
        // },
        {
            id: 5,
            title: 'ID',
            IconComponent: IDsIcon,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-blue-400',
            type: BoostCategoryOptionsEnum.id,
            ShapeIcon: Hexagon,
            shapeColor: 'text-blue-400 w-[45px] h-[45px]',
            iconStyles: 'h-[33px] w-[33px] !top-[55%]',
            WalletIcon: IDsIcon,
        },
    ],
};

export const CATEGORY_TO_SUBCATEGORY_LIST: {
    [key: BoostCategoryOptionsEnum | string]: {
        title: string;
        type: any;
    }[];
} = {
    [BoostCategoryOptionsEnum.achievement]: [
        {
            title: 'Degree',
            type: AchievementTypes.Degree,
        },
        {
            title: 'Certificate',
            type: AchievementTypes.Certificate,
        },
        {
            title: 'Course Completion',
            type: AchievementTypes.CourseCompletion,
        },
        {
            title: 'Attendance',
            type: AchievementTypes.Attendance,
        },
        {
            title: "Dean's List",
            type: AchievementTypes.DeansList,
        },
        {
            title: 'Honors Award',
            type: AchievementTypes.HonorsAward,
        },
        {
            title: 'Research Publication',
            type: AchievementTypes.ResearchPublication,
        },
        {
            title: 'Certification',
            type: AchievementTypes.ProfessionalCertification,
        },
        {
            title: 'Fellowship',
            type: AchievementTypes.Fellowship,
        },
        {
            title: 'Language Proficiency',
            type: AchievementTypes.LanguageProficiency,
        },

        // extended ( Achievement ) category types
        // {
        //     title: 'Generic',
        //     type: AchievementTypes.Achievement,
        // },
        // {
        //     title: 'Formal Award',
        //     type: AchievementTypes.Award,
        // },
        // {
        //     title: 'Online Badge',
        //     type: AchievementTypes.Badge,
        // },
        // {
        //     title: 'Community Service',
        //     type: AchievementTypes.CommunityService,
        // },

        // {
        //     title: 'Credential',
        //     type: AchievementTypes.Credential,
        // },
        // {
        //     title: 'Language',
        //     type: AchievementTypes.Language,
        // },
        // {
        //     title: 'Upskilling',
        //     type: AchievementTypes.Upskilling,
        // },
    ],
    [BoostCategoryOptionsEnum.id]: [
        // {
        //     title: 'License',
        //     type: AchievementTypes.License,
        // },

        // extended ( ID ) category types
        // {
        //     title: 'Student ID',
        //     type: AchievementTypes.StudentID,
        // },
        {
            title: 'School ID',
            type: AchievementTypes.SchoolID,
        },
        {
            title: 'Employer ID',
            type: AchievementTypes.EmployerID,
        },
        {
            title: 'College ID',
            type: AchievementTypes.CollegeID,
        },
        {
            title: 'University ID',
            type: AchievementTypes.UniversityID,
        },
        {
            title: 'Association ID',
            type: AchievementTypes.AssociationID,
        },
        {
            title: 'Library Card',
            type: AchievementTypes.LibraryCard,
        },
        {
            title: 'Taskforce ID',
            type: AchievementTypes.TaskforceID,
        },
        {
            title: 'Event ID',
            type: AchievementTypes.EventID,
        },

        // {
        //     title: 'Member ID',
        //     type: AchievementTypes.MemberID,
        // },
        // {
        //     title: 'Member NFT ID',
        //     type: AchievementTypes.MemberNFTID,
        // },
        // {
        //     title: 'Drivers License',
        //     type: AchievementTypes.DriversLicense,
        // },
        // {
        //     title: 'State/National ID',
        //     type: AchievementTypes.StateOrNationalID,
        // },
        // {
        //     title: 'Passport',
        //     type: AchievementTypes.Passport,
        // },
    ],
    [BoostCategoryOptionsEnum.skill]: [
        {
            title: 'Assessment',
            type: AchievementTypes.Assessment,
        },
        {
            title: 'Certificate',
            type: AchievementTypes.Certificate,
        },
        {
            title: 'Certification',
            type: AchievementTypes.Certification,
        },
        {
            title: 'Competency',
            type: AchievementTypes.Competency,
        },
        {
            title: 'MicroCredential',
            type: AchievementTypes.MicroCredential,
        },
    ],
    [BoostCategoryOptionsEnum.learningHistory]: [
        {
            title: 'Course',
            type: AchievementTypes.Course,
        },
        {
            title: 'Class',
            type: AchievementTypes.Class,
        },
        {
            title: 'Module',
            type: AchievementTypes.Module,
        },
        {
            title: 'Program',
            type: AchievementTypes.Program,
        },
        {
            title: 'Study',
            type: AchievementTypes.Study,
        },
        {
            title: 'Training',
            type: AchievementTypes.Training,
        },
        {
            title: 'Workshop',
            type: AchievementTypes.Workshop,
        },
        {
            title: 'Seminar',
            type: AchievementTypes.Seminar,
        },
        {
            title: 'Webinar',
            type: AchievementTypes.Webinar,
        },
        {
            title: 'Lecture',
            type: AchievementTypes.Lecture,
        },
        {
            title: 'Bootcamp',
            type: AchievementTypes.Bootcamp,
        },
        {
            title: 'Study Group',
            type: AchievementTypes.StudyGroup,
        },
        {
            title: 'Tutoring Session',
            type: AchievementTypes.TutoringSession,
        },
        {
            title: 'Laboratory',
            type: AchievementTypes.Laboratory,
        },

        // extended ( Learning History ) category types
        // {
        //     title: 'Assignment',
        //     type: AchievementTypes.Assignment,
        // },
        // {
        //     title: 'Associate Degree',
        //     type: AchievementTypes.AssociateDegree,
        // },
        // {
        //     title: 'Bachelor Degree',
        //     type: AchievementTypes.BachelorDegree,
        // },
        // {
        //     title: 'Certificate',
        //     type: AchievementTypes.CertificateOfCompletion,
        // },

        // {
        //     title: 'Co-Curricular',
        //     type: AchievementTypes.CoCurricular,
        // },
        // {
        //     title: 'Research Doctorate',
        //     type: AchievementTypes.ResearchDoctorate,
        // },
        // {
        //     title: 'Report Card',
        //     type: AchievementTypes.ReportCard,
        // },
        // {
        //     title: 'Micro Degree',
        //     type: AchievementTypes.MicroDegree,
        // },
    ],
    [BoostCategoryOptionsEnum.workHistory]: [
        {
            title: 'Job',
            type: AchievementTypes.Job,
        },
        {
            title: 'Club',
            type: AchievementTypes.Club,
        },
        {
            title: 'Internship',
            type: AchievementTypes.Internship,
        },
        {
            title: 'Event',
            type: AchievementTypes.Event,
        },
        {
            title: 'Volunteering',
            type: AchievementTypes.Volunteering,
        },
        {
            title: 'Freelance',
            type: AchievementTypes.Freelance,
        },
        {
            title: 'Research Project',
            type: AchievementTypes.ResearchProject,
        },
        {
            title: 'Study Abroad',
            type: AchievementTypes.StudyAbroad,
        },
        {
            title: 'Apprenticeship',
            type: AchievementTypes.Apprenticeship,
        },
        {
            title: 'Conference',
            type: AchievementTypes.Conference,
        },
        {
            title: 'Sports Team',
            type: AchievementTypes.SportsTeam,
        },
        {
            title: 'Art Exhibition',
            type: AchievementTypes.ArtExhibition,
        },
        {
            title: 'Production',
            type: AchievementTypes.Production,
        },
    ],
    [BoostCategoryOptionsEnum.socialBadge]: [
        {
            title: 'Risk Taker',
            type: AchievementTypes.RiskTaker,
        },
        {
            title: 'Opportunist',
            type: AchievementTypes.Opportunist,
        },
        {
            title: 'Cool Cat',
            type: AchievementTypes.CoolCat,
        },
        {
            title: 'Tastemaker',
            type: AchievementTypes.Tastemaker,
        },
        {
            title: 'Trailblazer',
            type: AchievementTypes.Trailblazer,
        },
        {
            title: 'Influencer',
            type: AchievementTypes.Influencer,
        },
        {
            title: 'Connector',
            type: AchievementTypes.Connector,
        },
        {
            title: 'Maven',
            type: AchievementTypes.Maven,
        },
        {
            title: 'Trendsetter',
            type: AchievementTypes.Trendsetter,
        },
        {
            title: 'Organizer',
            type: AchievementTypes.Organizer,
        },
        {
            title: 'Moderator',
            type: AchievementTypes.Moderator,
        },
        {
            title: 'Leader',
            type: AchievementTypes.Leader,
        },
        {
            title: 'Catalyst',
            type: AchievementTypes.Catalyst,
        },
        {
            title: 'Expert',
            type: AchievementTypes.Expert,
        },
        {
            title: 'Enthusiast',
            type: AchievementTypes.Enthusiast,
        },
        {
            title: 'Ambassador',
            type: AchievementTypes.Ambassador,
        },
        {
            title: 'Aficionado',
            type: AchievementTypes.Aficionado,
        },
        {
            title: 'Psychic',
            type: AchievementTypes.Psychic,
        },
        {
            title: 'Magician',
            type: AchievementTypes.Magician,
        },
        {
            title: 'Charmer',
            type: AchievementTypes.Charmer,
        },
        {
            title: 'Cowboy',
            type: AchievementTypes.Cowboy,
        },
        {
            title: 'Perfectionist',
            type: AchievementTypes.Perfectionist,
        },
        {
            title: 'Enabler',
            type: AchievementTypes.Enabler,
        },
        {
            title: 'Maverick',
            type: AchievementTypes.Maverick,
        },
        {
            title: 'Informer',
            type: AchievementTypes.Informer,
        },
        {
            title: 'Wanderer',
            type: AchievementTypes.Wanderer,
        },
        {
            title: 'Propagator',
            type: AchievementTypes.Propagator,
        },
        {
            title: 'Hot Shot',
            type: AchievementTypes.HotShot,
        },
        {
            title: 'Sage',
            type: AchievementTypes.Sage,
        },
        {
            title: 'Change Maker',
            type: AchievementTypes.ChangeMaker,
        },
        {
            title: 'Challenger',
            type: AchievementTypes.Challenger,
        },
        {
            title: 'Team Player',
            type: AchievementTypes.TeamPlayer,
        },
        {
            title: 'Star',
            type: AchievementTypes.Star,
        },
        {
            title: 'Party Animal',
            type: AchievementTypes.PartyAnimal,
        },
        {
            title: 'Trouble Maker',
            type: AchievementTypes.TroubleMaker,
        },
        {
            title: 'Party Planner',
            type: AchievementTypes.PartyPlanner,
        },
        {
            title: 'Challenge Maker',
            type: AchievementTypes.ChallengeMaker,
        },
        {
            title: 'Promoter',
            type: AchievementTypes.Promoter,
        },
        {
            title: 'Doer',
            type: AchievementTypes.Doer,
        },
        {
            title: 'Entertainer',
            type: AchievementTypes.Entertainer,
        },
        {
            title: 'Connoisseur',
            type: AchievementTypes.Connoisseur,
        },
    ],
    // copied over learning history types for now
    [BoostCategoryOptionsEnum.course]: [
        {
            title: 'Assignment',
            type: AchievementTypes.Assignment,
        },
        {
            title: 'Associate Degree',
            type: AchievementTypes.AssociateDegree,
        },
        {
            title: 'Bachelor Degree',
            type: AchievementTypes.BachelorDegree,
        },
        {
            title: 'Certificate',
            type: AchievementTypes.CertificateOfCompletion,
        },
        {
            title: 'Course',
            type: AchievementTypes.Course,
        },
        {
            title: 'Co-Curricular',
            type: AchievementTypes.CoCurricular,
        },
        {
            title: 'Research Doctorate',
            type: AchievementTypes.ResearchDoctorate,
        },

        // extended ( Learning History ) category types
        {
            title: 'Report Card',
            type: AchievementTypes.ReportCard,
        },
        {
            title: 'Micro Degree',
            type: AchievementTypes.MicroDegree,
        },
    ],
    // copied over work history sub categories for now
    [BoostCategoryOptionsEnum.job]: [
        {
            title: 'Job',
            type: AchievementTypes.Job,
        },
        {
            title: 'Club',
            type: AchievementTypes.Club,
        },
        {
            title: 'Internship',
            type: AchievementTypes.Internship,
        },
        {
            title: 'Event',
            type: AchievementTypes.Event,
        },
        {
            title: 'Volunteering',
            type: AchievementTypes.Volunteering,
        },
        {
            title: 'Freelance',
            type: AchievementTypes.Freelance,
        },
        {
            title: 'Research Project',
            type: AchievementTypes.ResearchProject,
        },
        {
            title: 'Study Abroad',
            type: AchievementTypes.StudyAbroad,
        },
        {
            title: 'Apprenticeship',
            type: AchievementTypes.Apprenticeship,
        },
        {
            title: 'Research Project',
            type: AchievementTypes.ResearchProject,
        },
        {
            title: 'Conference',
            type: AchievementTypes.Conference,
        },
        {
            title: 'Sports Team',
            type: AchievementTypes.SportsTeam,
        },
        {
            title: 'Art Exhibition',
            type: AchievementTypes.ArtExhibition,
        },
        {
            title: 'Production',
            type: AchievementTypes.Production,
        },
    ],
    [BoostCategoryOptionsEnum.membership]: [
        {
            title: 'Group',
            type: AchievementTypes.Group,
        },
        {
            title: 'Troop',
            type: AchievementTypes.Troop,
        },
        {
            title: 'Class',
            type: AchievementTypes.Class,
        },
        {
            title: 'School',
            type: AchievementTypes.School,
        },
        {
            title: 'College',
            type: AchievementTypes.College,
        },
        {
            title: 'University',
            type: AchievementTypes.University,
        },
        {
            title: 'Association',
            type: AchievementTypes.Association,
        },
        {
            title: 'Team',
            type: AchievementTypes.Team,
        },
        {
            title: 'Workgroup',
            type: AchievementTypes.Workgroup,
        },
        {
            title: 'Taskforce',
            type: AchievementTypes.Taskforce,
        },
        {
            title: 'Agency',
            type: AchievementTypes.Agency,
        },
        {
            title: 'Company',
            type: AchievementTypes.Company,
        },
        {
            title: 'Organization',
            type: AchievementTypes.Organization,
        },
        {
            title: 'NGO',
            type: AchievementTypes.NGO,
        },
        {
            title: 'Legislative',
            type: AchievementTypes.Legislative,
        },
        {
            title: 'DAO',
            type: AchievementTypes.DAO,
        },
        {
            title: 'Community',
            type: AchievementTypes.Community,
        },
        {
            title: 'Movement',
            type: AchievementTypes.Movement,
        },
        {
            title: 'Club',
            type: AchievementTypes.Club,
        },
        {
            title: 'Network',
            type: AchievementTypes.Network,
        },
    ],
    [BoostCategoryOptionsEnum.accomplishment]: [
        {
            title: 'Homework',
            type: AchievementTypes.Homework,
        },
        {
            title: 'Presentation',
            type: AchievementTypes.Presentation,
        },
        {
            title: 'Content',
            type: AchievementTypes.Content,
        },
        {
            title: 'Practice',
            type: AchievementTypes.Practice,
        },
        {
            title: 'Hacks',
            type: AchievementTypes.Hacks,
        },
        {
            title: 'Ideas',
            type: AchievementTypes.Ideas,
        },
        {
            title: 'Project',
            type: AchievementTypes.Project,
        },
        {
            title: 'Thesis',
            type: AchievementTypes.Thesis,
        },
        {
            title: 'Artwork',
            type: AchievementTypes.Artwork,
        },
        {
            title: 'Software',
            type: AchievementTypes.Software,
        },
        {
            title: 'Business Plan',
            type: AchievementTypes.BusinessPlan,
        },
    ],
    [BoostCategoryOptionsEnum.accommodation]: [
        {
            title: 'Disability',
            type: AchievementTypes.Disability,
        },
        {
            title: 'Medical Record',
            type: AchievementTypes.MedicalRecord,
        },
        {
            title: 'Permission Slip',
            type: AchievementTypes.PermissionSlip,
        },
        {
            title: 'Dietary Requirements',
            type: AchievementTypes.DietaryRequirements,
        },
        {
            title: 'Allergy Information',
            type: AchievementTypes.AllergyInformation,
        },
        {
            title: 'Mobility Assistance',
            type: AchievementTypes.MobilityAssistance,
        },
        {
            title: 'Exam Adjustments',
            type: AchievementTypes.ExamAdjustments,
        },
        {
            title: 'Special Equipment',
            type: AchievementTypes.SpecialEquipment,
        },
        {
            title: 'Note-Taking Services',
            type: AchievementTypes.NoteTakingServices,
        },
        {
            title: 'Sign Language',
            type: AchievementTypes.SignLanguageInterpreter,
        },
        {
            title: 'Extended Deadline',
            type: AchievementTypes.ExtendedDeadline,
        },
        {
            title: 'Housing Arrangement',
            type: AchievementTypes.HousingArrangement,
        },
        {
            title: 'Transportation Services',
            type: AchievementTypes.TransportationServices,
        },
    ],
    [BoostCategoryOptionsEnum.family]: [
        {
            title: 'Family',
            type: AchievementTypes.Family,
        },
    ],
};

export const defaultIDCardImage =
    'https://cdn.filestackcontent.com/rotate=deg:exif/resize=width:600/auto_image/CH8dyPGwSyChmczTdIY4';

export const defaultCategoryThumbImages = [
    // social badge
    'https://cdn.filestackcontent.com/hnnK9FFQL6XjlKdkd8Hs',
    // achievement trophy
    'https://cdn.filestackcontent.com/P9zICsCHQP2NJs1EzYj5',
    // courses ladder
    'https://cdn.filestackcontent.com/zBtHw5EqTJDb5r6Pw7cg',
    // experience mountain
    'https://cdn.filestackcontent.com/qCnVK8dReWkRjoQCSH6Q',
    // user id tag
    'https://cdn.filestackcontent.com/9z6i0x3hSlG43paNZHag',
    // skill puzzle piece
    'https://cdn.filestackcontent.com/9lKwrJdoRPmv9chLFJQv',
    // membership key
    'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
    // accommodation hands
    'https://cdn.filestackcontent.com/I4T9X90XQGSlk1YpcGGc',
    // family cats
    'https://cdn.filestackcontent.com/yfeWgdSWQ7Ckl4sVuGLc',
];

export const BOOST_CATEGORY_TO_WALLET_ROUTE = {
    ['ID']: 'ids',
    ['Learning History']: 'learninghistory',
    ['Achievement']: 'achievements',
    ['Work History']: 'workhistory',
    ['Skill']: 'skills',
    ['Social Badge']: 'socialBadges',
    ['Membership']: 'memberships',
    ['Accomplishment']: 'accomplishments',
    ['Accommodation']: 'accommodations',
    ['Family']: 'families',
};
