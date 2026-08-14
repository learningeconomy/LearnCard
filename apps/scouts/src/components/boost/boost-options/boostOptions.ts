import React from 'react';

import ShieldChevron from 'learn-card-base/svgs/ShieldChevron';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import User from 'learn-card-base/svgs/User';
import Trophy from 'learn-card-base/svgs/Trophy';
import Graduation from 'learn-card-base/svgs/Graduation';
import Briefcase from 'learn-card-base/svgs/Briefcase';

import { AchievementTypes } from 'learn-card-base/components/IssueVC/constants';
import ScoutsPledge from 'learn-card-base/svgs/ScoutsPledge';
import ScoutsGlobe from 'learn-card-base/svgs/ScoutsGlobe';
import BoostOutline2, { BlueBoostOutline2 } from 'learn-card-base/svgs/BoostOutline2';
import {
    BoostCategoryMetadata,
    BoostCategoryOptionsEnum,
    boostCategoryMetadata,
} from 'learn-card-base/types/boostAndCredentialMetadata';
import * as m from '../../../paraglide/messages.js';

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
            get title() {
                return m['boostContent.vcTypes.self.socialBadge.title']();
            },
            IconComponent: ScoutsPledge,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-sp-purple-base',
            type: BoostCategoryOptionsEnum.socialBadge,
        },
    ],
    [BoostUserTypeEnum.someone]: [
        {
            id: 1,
            get title() {
                return m['boostContent.vcTypes.someone.meritBadge.title']();
            },
            IconComponent: ScoutsPledge,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-sp-purple-base',
            type: BoostCategoryOptionsEnum.meritBadge,
        },
        {
            id: 2,
            get title() {
                return m['boostContent.vcTypes.someone.socialBadge.title']();
            },
            IconComponent: BoostOutline2,
            iconClassName: 'text-white',
            iconCircleClass: 'bg-sp-blue-dark-ocean',
            type: BoostCategoryOptionsEnum.socialBadge,
        },
    ],
};

// relevant info has been ported to learn-card-base, but there are some differences...
export const boostCategoryOptions: {
    [key: BoostCategoryOptionsEnum | string]: {
        title: string;
        subTitle?: string;
        value: BoostCategoryOptionsEnum;
        color: string;
        subColor: string;
        IconComponent: React.ReactNode | string;
        CategoryImage: string;
    } & BoostCategoryMetadata;
} = {
    [BoostCategoryOptionsEnum.socialBadge]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.socialBadge],
        get title() {
            return m['boostContent.categories.socialBadge.title']();
        },
        get subTitle() {
            return m['boostContent.categories.socialBadge.subTitle']();
        },
        color: 'sp-blue-dark-ocean',
        subColor: 'sp-blue-ocean',
        IconComponent: BlueBoostOutline2,
        CategoryImage: 'https://cdn.filestackcontent.com/EHl1PKEQTPuErCax48Uy',
    },
    [BoostCategoryOptionsEnum.achievement]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.achievement],
        get title() {
            return m['boostContent.categories.achievement.title']();
        },
        color: 'spice-500',
        subColor: 'spice-400',
        IconComponent: Trophy,
        CategoryImage: 'https://cdn.filestackcontent.com/EHl1PKEQTPuErCax48Uy',
    },
    [BoostCategoryOptionsEnum.course]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.course],
        get title() {
            return m['boostContent.categories.course.title']();
        },
        CategoryImage: 'https://cdn.filestackcontent.com/PCIwcDr5QgiiHPv5GYvY',
    },
    [BoostCategoryOptionsEnum.job]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.job],
        get title() {
            return m['boostContent.categories.job.title']();
        },
    },
    [BoostCategoryOptionsEnum.id]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.id],
        get title() {
            return m['boostContent.categories.id.title']();
        },
        color: 'sp-green-base',
        subColor: 'sp-green-light',
        IconComponent: ScoutsGlobe,
        CategoryImage: 'https://cdn.filestackcontent.com/Otl66rNhTFu66mGf96Iq',
    },
    [BoostCategoryOptionsEnum.membership]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.membership],
        get title() {
            return m['boostContent.categories.membership.title']();
        },
        value: BoostCategoryOptionsEnum.membership,
        color: 'sp-green-base',
        subColor: 'sp-green-light',
        IconComponent: ScoutsGlobe,
        CategoryImage: 'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
    },
    [BoostCategoryOptionsEnum.skill]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.skill],
        get title() {
            return m['boostContent.categories.skill.title']();
        },
        value: BoostCategoryOptionsEnum.skill,
        color: 'indigo-600',
        subColor: 'indigo-400',
        IconComponent: PuzzlePiece,
        CategoryImage: 'https://cdn.filestackcontent.com/9lKwrJdoRPmv9chLFJQv',
    },
    [BoostCategoryOptionsEnum.learningHistory]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.learningHistory],
        get title() {
            return m['boostContent.categories.learningHistory.title']();
        },
        value: BoostCategoryOptionsEnum.learningHistory,
        color: 'emerald-700',
        subColor: 'emerald-500',
        IconComponent: Graduation,
        CategoryImage: 'https://cdn.filestackcontent.com/PCIwcDr5QgiiHPv5GYvY',
    },
    [BoostCategoryOptionsEnum.workHistory]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.workHistory],
        get title() {
            return m['boostContent.categories.workHistory.title']();
        },
        value: BoostCategoryOptionsEnum.workHistory,
        color: 'rose-600',
        subColor: 'rose-400',
        IconComponent: Briefcase,
        CategoryImage: 'https://cdn.filestackcontent.com/2eR985mSrur9mK4V4mzQ',
    },
    [BoostCategoryOptionsEnum.meritBadge]: {
        ...boostCategoryMetadata[BoostCategoryOptionsEnum.meritBadge],
        get title() {
            return m['boostContent.categories.meritBadge.title']();
        },
        get subTitle() {
            return m['boostContent.categories.meritBadge.subTitle']();
        },
        value: BoostCategoryOptionsEnum.meritBadge,
        color: 'sp-purple-base',
        subColor: 'sp-purple-light',
        IconComponent: ScoutsPledge,
        CategoryImage: 'https://cdn.filestackcontent.com/2eR985mSrur9mK4V4mzQ', // TODO
    },
};

export const CATEGORY_TO_SUBCATEGORY_LIST: {
    [key: BoostUserTypeEnum | string]: {
        title: string;
        presetTitle?: string;
        description?: string;
        criteria?: string;
        image?: string;
        type: any;
    }[];
} = {
    [BoostCategoryOptionsEnum.achievement]: [
        {
            get title() {
                return m['boostContent.subcategories.achievement.achievement.title']();
            },
            type: AchievementTypes.Achievement,
        },
        {
            get title() {
                return m['boostContent.subcategories.achievement.award.title']();
            },
            type: AchievementTypes.Award,
        },
        {
            get title() {
                return m['boostContent.subcategories.achievement.badge.title']();
            },
            type: AchievementTypes.Badge,
        },
        {
            get title() {
                return m['boostContent.subcategories.achievement.communityService.title']();
            },
            type: AchievementTypes.CommunityService,
        },

        // extended ( Achievement ) category types
        {
            get title() {
                return m['boostContent.subcategories.achievement.credential.title']();
            },
            type: AchievementTypes.Credential,
        },
        {
            get title() {
                return m['boostContent.subcategories.achievement.language.title']();
            },
            type: AchievementTypes.Language,
        },
        {
            get title() {
                return m['boostContent.subcategories.achievement.training.title']();
            },
            type: AchievementTypes.Training,
        },
        {
            get title() {
                return m['boostContent.subcategories.achievement.workshop.title']();
            },
            type: AchievementTypes.Workshop,
        },
        {
            get title() {
                return m['boostContent.subcategories.achievement.upskilling.title']();
            },
            type: AchievementTypes.Upskilling,
        },
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
            get title() {
                return m['boostContent.subcategories.id.memberID.title']();
            },
            type: AchievementTypes.MemberID,
        },
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
    [BoostCategoryOptionsEnum.membership]: [
        // Troops 2.0
        {
            get title() {
                return m['boostContent.subcategories.membership.global.title']();
            },
            type: AchievementTypes.Global,
        },
        {
            get title() {
                return m['boostContent.subcategories.membership.network.title']();
            },
            type: AchievementTypes.Network,
        },
        {
            get title() {
                return m['boostContent.subcategories.membership.troop.title']();
            },
            type: AchievementTypes.Troop,
        },
        {
            get title() {
                return m['boostContent.subcategories.membership.leader.title']();
            },
            type: AchievementTypes.Leader,
        },
        {
            get title() {
                return m['boostContent.subcategories.membership.scoutMember.title']();
            },
            type: AchievementTypes.ScoutMember,
        },
        // Troops 2.0

        // {
        //     title: 'Group',
        //     type: AchievementTypes.Group,
        // },
        // {
        //     title: 'Project',
        //     type: AchievementTypes.Project,
        // },
        // {
        //     title: 'Class',
        //     type: AchievementTypes.Class,
        // },
        // {
        //     title: 'School',
        //     type: AchievementTypes.School,
        // },
        // {
        //     title: 'College',
        //     type: AchievementTypes.College,
        // },
        // {
        //     title: 'University',
        //     type: AchievementTypes.University,
        // },
        // {
        //     title: 'Association',
        //     type: AchievementTypes.Association,
        // },
        // {
        //     title: 'Team',
        //     type: AchievementTypes.Team,
        // },
        // {
        //     title: 'Workgroup',
        //     type: AchievementTypes.Workgroup,
        // },
        // {
        //     title: 'Taskforce',
        //     type: AchievementTypes.Taskforce,
        // },
        // {
        //     title: 'Agency',
        //     type: AchievementTypes.Agency,
        // },
        // {
        //     title: 'Company',
        //     type: AchievementTypes.Company,
        // },
        // {
        //     title: 'Organization',
        //     type: AchievementTypes.Organization,
        // },
        // {
        //     title: 'NGO',
        //     type: AchievementTypes.NGO,
        // },
        // {
        //     title: 'Legislative',
        //     type: AchievementTypes.Legislative,
        // },
        // {
        //     title: 'DAO',
        //     type: AchievementTypes.DAO,
        // },
        // {
        //     title: 'Community',
        //     type: AchievementTypes.Community,
        // },
        // {
        //     title: 'Movement',
        //     type: AchievementTypes.Movement,
        // },
        // {
        //     title: 'Club',
        //     type: AchievementTypes.Club,
        // },
    ],
    [BoostCategoryOptionsEnum.skill]: [
        {
            get title() {
                return m['boostContent.subcategories.skill.assessment.title']();
            },
            type: AchievementTypes.Assessment,
        },
        {
            get title() {
                return m['boostContent.subcategories.skill.certificate.title']();
            },
            type: AchievementTypes.Certificate,
        },
        {
            get title() {
                return m['boostContent.subcategories.skill.certification.title']();
            },
            type: AchievementTypes.Certification,
        },
        {
            get title() {
                return m['boostContent.subcategories.skill.competency.title']();
            },
            type: AchievementTypes.Competency,
        },
        {
            get title() {
                return m['boostContent.subcategories.skill.microCredential.title']();
            },
            type: AchievementTypes.MicroCredential,
        },
    ],
    [BoostCategoryOptionsEnum.learningHistory]: [
        {
            get title() {
                return m['boostContent.subcategories.learningHistory.assignment.title']();
            },
            type: AchievementTypes.Assignment,
        },
        {
            get title() {
                return m['boostContent.subcategories.learningHistory.associateDegree.title']();
            },
            type: AchievementTypes.AssociateDegree,
        },
        {
            get title() {
                return m['boostContent.subcategories.learningHistory.bachelorDegree.title']();
            },
            type: AchievementTypes.BachelorDegree,
        },
        {
            get title() {
                return m[
                    'boostContent.subcategories.learningHistory.certificateOfCompletion.title'
                ]();
            },
            type: AchievementTypes.CertificateOfCompletion,
        },
        {
            get title() {
                return m['boostContent.subcategories.learningHistory.course.title']();
            },
            type: AchievementTypes.Course,
        },
        {
            get title() {
                return m['boostContent.subcategories.learningHistory.coCurricular.title']();
            },
            type: AchievementTypes.CoCurricular,
        },
        {
            get title() {
                return m['boostContent.subcategories.learningHistory.researchDoctorate.title']();
            },
            type: AchievementTypes.ResearchDoctorate,
        },

        // extended ( Learning History ) category types
        {
            get title() {
                return m['boostContent.subcategories.learningHistory.reportCard.title']();
            },
            type: AchievementTypes.ReportCard,
        },
        {
            get title() {
                return m['boostContent.subcategories.learningHistory.microDegree.title']();
            },
            type: AchievementTypes.MicroDegree,
        },
    ],
    [BoostCategoryOptionsEnum.workHistory]: [
        {
            get title() {
                return m[
                    'boostContent.subcategories.workHistory.apprenticeshipCertificate.title'
                ]();
            },
            type: AchievementTypes.ApprenticeshipCertificate,
        },
        {
            get title() {
                return m['boostContent.subcategories.workHistory.fieldwork.title']();
            },
            type: AchievementTypes.Fieldwork,
        },
        {
            get title() {
                return m['boostContent.subcategories.workHistory.journeymanCertificate.title']();
            },
            type: AchievementTypes.JourneymanCertificate,
        },
        {
            get title() {
                return m['boostContent.subcategories.workHistory.masterCertificate.title']();
            },
            type: AchievementTypes.MasterCertificate,
        },

        // extended ( Work History ) category types
        {
            get title() {
                return m['boostContent.subcategories.workHistory.job.title']();
            },
            type: AchievementTypes.Job,
        },
        {
            get title() {
                return m['boostContent.subcategories.workHistory.internship.title']();
            },
            type: AchievementTypes.Internship,
        },
        {
            get title() {
                return m['boostContent.subcategories.workHistory.volunteer.title']();
            },
            type: AchievementTypes.Volunteer,
        },
        {
            get title() {
                return m['boostContent.subcategories.workHistory.fellowship.title']();
            },
            type: AchievementTypes.Fellowship,
        },
        {
            get title() {
                return m['boostContent.subcategories.workHistory.board.title']();
            },
            type: AchievementTypes.Board,
        },
    ],
    // copied over achievement sub categories for now
    [BoostCategoryOptionsEnum.socialBadge]: [
        // {
        //     title: 'Risk Taker',
        //     type: AchievementTypes.RiskTaker,
        // },
        // {
        //     title: 'Opportunist',
        //     type: AchievementTypes.Opportunist,
        // },
        // {
        //     title: 'Cool Cat',
        //     type: AchievementTypes.CoolCat,
        // },
        // {
        //     title: 'Tastemaker',
        //     type: AchievementTypes.Tastemaker,
        // },
        // {
        //     title: 'Trailblazer',
        //     type: AchievementTypes.Trailblazer,
        // },
        // {
        //     title: 'Influencer',
        //     type: AchievementTypes.Influencer,
        // },
        // {
        //     title: 'Connector',
        //     type: AchievementTypes.Connector,
        // },
        // {
        //     title: 'Maven',
        //     type: AchievementTypes.Maven,
        // },
        // {
        //     title: 'Trendsetter',
        //     type: AchievementTypes.Trendsetter,
        // },
        // {
        //     title: 'Organizer',
        //     type: AchievementTypes.Organizer,
        // },
        // {
        //     title: 'Moderator',
        //     type: AchievementTypes.Moderator,
        // },
        // {
        //     title: 'Leader',
        //     type: AchievementTypes.Leader,
        // },
        // {
        //     title: 'Catalyst',
        //     type: AchievementTypes.Catalyst,
        // },
        // {
        //     title: 'Expert',
        //     type: AchievementTypes.Expert,
        // },
        // {
        //     title: 'Enthusiast',
        //     type: AchievementTypes.Enthusiast,
        // },
        // {
        //     title: 'Ambassador',
        //     type: AchievementTypes.Ambassador,
        // },
        // {
        //     title: 'Aficionado',
        //     type: AchievementTypes.Aficionado,
        // },
        // {
        //     title: 'Psychic',
        //     type: AchievementTypes.Psychic,
        // },
        // {
        //     title: 'Magician',
        //     type: AchievementTypes.Magician,
        // },
        // {
        //     title: 'Charmer',
        //     type: AchievementTypes.Charmer,
        // },
        // {
        //     title: 'Cowboy',
        //     type: AchievementTypes.Cowboy,
        // },
        // {
        //     title: 'Perfectionist',
        //     type: AchievementTypes.Perfectionist,
        // },
        // {
        //     title: 'Enabler',
        //     type: AchievementTypes.Enabler,
        // },
        // {
        //     title: 'Maverick',
        //     type: AchievementTypes.Maverick,
        // },
        // {
        //     title: 'Informer',
        //     type: AchievementTypes.Informer,
        // },
        // {
        //     title: 'Wanderer',
        //     type: AchievementTypes.Wanderer,
        // },
        // {
        //     title: 'Propagator',
        //     type: AchievementTypes.Propagator,
        // },
        // {
        //     title: 'Hot Shot',
        //     type: AchievementTypes.HotShot,
        // },
        // {
        //     title: 'Sage',
        //     type: AchievementTypes.Sage,
        // },
        // {
        //     title: 'Change Maker',
        //     type: AchievementTypes.ChangeMaker,
        // },
        // {
        //     title: 'Challenger',
        //     type: AchievementTypes.Challenger,
        // },
        // {
        //     title: 'Team Player',
        //     type: AchievementTypes.TeamPlayer,
        // },
        // {
        //     title: 'Star',
        //     type: AchievementTypes.Star,
        // },
        // {
        //     title: 'Party Animal',
        //     type: AchievementTypes.PartyAnimal,
        // },
        // {
        //     title: 'Trouble Maker',
        //     type: AchievementTypes.TroubleMaker,
        // },
        // {
        //     title: 'Party Planner',
        //     type: AchievementTypes.PartyPlanner,
        // },
        // {
        //     title: 'Challenge Maker',
        //     type: AchievementTypes.ChallengeMaker,
        // },
        // {
        //     title: 'Promoter',
        //     type: AchievementTypes.Promoter,
        // },
        // {
        //     title: 'Doer',
        //     type: AchievementTypes.Doer,
        // },
        // {
        //     title: 'Entertainer',
        //     type: AchievementTypes.Entertainer,
        // },
        // {
        //     title: 'Connoisseur',
        //     type: AchievementTypes.Connoisseur,
        // },

        // ScoutPass official Badges
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.adventurer.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.adventurer.presetTitle']();
            },
            type: AchievementTypes.Adventurer,
            get description() {
                return m['boostContent.subcategories.socialBadge.adventurer.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.adventurer.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.unifier.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.unifier.presetTitle']();
            },
            type: AchievementTypes.Unifier,
            get description() {
                return m['boostContent.subcategories.socialBadge.unifier.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.unifier.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.protector.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.protector.presetTitle']();
            },
            type: AchievementTypes.Protector,
            get description() {
                return m['boostContent.subcategories.socialBadge.protector.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.protector.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.jester.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.jester.presetTitle']();
            },
            type: AchievementTypes.Jester,
            get description() {
                return m['boostContent.subcategories.socialBadge.jester.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.jester.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.survivor.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.survivor.presetTitle']();
            },
            type: AchievementTypes.Survivor,
            get description() {
                return m['boostContent.subcategories.socialBadge.survivor.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.survivor.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.knotMaster.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.knotMaster.presetTitle']();
            },
            type: AchievementTypes.KnotMaster,
            get description() {
                return m['boostContent.subcategories.socialBadge.knotMaster.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.knotMaster.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.changeMaker.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.changeMaker.presetTitle']();
            },
            type: AchievementTypes.ChangeMaker,
            get description() {
                return m['boostContent.subcategories.socialBadge.changeMaker.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.changeMaker.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.diplomat.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.diplomat.presetTitle']();
            },
            type: AchievementTypes.Diplomat,
            get description() {
                return m['boostContent.subcategories.socialBadge.diplomat.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.diplomat.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.optimist.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.optimist.presetTitle']();
            },
            type: AchievementTypes.Optimist,
            get description() {
                return m['boostContent.subcategories.socialBadge.optimist.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.optimist.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.mosquitoMagnet.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.mosquitoMagnet.presetTitle']();
            },
            type: AchievementTypes.MosquitoMagnet,
            get description() {
                return m['boostContent.subcategories.socialBadge.mosquitoMagnet.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.mosquitoMagnet.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.stylist.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.stylist.presetTitle']();
            },
            type: AchievementTypes.Stylist,
            get description() {
                return m['boostContent.subcategories.socialBadge.stylist.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.stylist.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.samaritan.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.samaritan.presetTitle']();
            },
            type: AchievementTypes.Samaritan,
            get description() {
                return m['boostContent.subcategories.socialBadge.samaritan.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.samaritan.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.innovator.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.innovator.presetTitle']();
            },
            type: AchievementTypes.Innovator,
            get description() {
                return m['boostContent.subcategories.socialBadge.innovator.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.innovator.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.prankster.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.prankster.presetTitle']();
            },
            type: AchievementTypes.Prankster,
            get description() {
                return m['boostContent.subcategories.socialBadge.prankster.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.prankster.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.inspirer.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.inspirer.presetTitle']();
            },
            type: AchievementTypes.Inspirer,
            get description() {
                return m['boostContent.subcategories.socialBadge.inspirer.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.inspirer.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.organizer.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.organizer.presetTitle']();
            },
            type: AchievementTypes.Organizer,
            get description() {
                return m['boostContent.subcategories.socialBadge.organizer.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.organizer.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.supporter.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.supporter.presetTitle']();
            },
            type: AchievementTypes.Supporter,
            get description() {
                return m['boostContent.subcategories.socialBadge.supporter.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.supporter.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.rested.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.rested.presetTitle']();
            },
            type: AchievementTypes.Rested,
            get description() {
                return m['boostContent.subcategories.socialBadge.rested.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.rested.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.celebrator.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.celebrator.presetTitle']();
            },
            type: AchievementTypes.Celebrator,
            get description() {
                return m['boostContent.subcategories.socialBadge.celebrator.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.celebrator.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.trustworthy.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.trustworthy.presetTitle']();
            },
            type: AchievementTypes.Trustworthy,
            get description() {
                return m['boostContent.subcategories.socialBadge.trustworthy.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.trustworthy.criteria']();
            },
        },
        // ! deprecated
        // {
        //     title: 'K-Star',
        //     presetTitle: 'K-POP Superstar',
        //     type: AchievementTypes.KStar,
        //     description: 'For the Scout who is a K-POP super fan and is so happy to be in Korea!',
        //     criteria:
        //         'The K-POP Superstar badge is awarded to the Scout who demonstrates passionate enthusiasm for K-POP and revels in the cultural experience of being in Korea.',
        // },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.connector.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.connector.presetTitle']();
            },
            type: AchievementTypes.Connector,
            get description() {
                return m['boostContent.subcategories.socialBadge.connector.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.connector.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.polyglot.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.polyglot.presetTitle']();
            },
            type: AchievementTypes.Polyglot,
            get description() {
                return m['boostContent.subcategories.socialBadge.polyglot.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.polyglot.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.trader.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.trader.presetTitle']();
            },
            type: AchievementTypes.Trader,
            get description() {
                return m['boostContent.subcategories.socialBadge.trader.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.trader.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.resilient.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.resilient.presetTitle']();
            },
            type: AchievementTypes.Resilient,
            get description() {
                return m['boostContent.subcategories.socialBadge.resilient.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.resilient.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.funMaker.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.funMaker.presetTitle']();
            },
            type: AchievementTypes.FunMaker,
            get description() {
                return m['boostContent.subcategories.socialBadge.funMaker.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.funMaker.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.tentMate.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.tentMate.presetTitle']();
            },
            type: AchievementTypes.TentMate,
            get description() {
                return m['boostContent.subcategories.socialBadge.tentMate.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.tentMate.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.packMaster.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.packMaster.presetTitle']();
            },
            type: AchievementTypes.PackMaster,
            get description() {
                return m['boostContent.subcategories.socialBadge.packMaster.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.packMaster.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.laterBird.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.laterBird.presetTitle']();
            },
            type: AchievementTypes.LaterBird,
            get description() {
                return m['boostContent.subcategories.socialBadge.laterBird.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.laterBird.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.snoozer.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.snoozer.presetTitle']();
            },
            type: AchievementTypes.Snoozer,
            get description() {
                return m['boostContent.subcategories.socialBadge.snoozer.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.snoozer.criteria']();
            },
        },
        // {
        //     title: 'Sub-Hero',
        //     presetTitle: 'Subcamp Superhero',
        //     type: AchievementTypes.SubHero,
        //     description: 'Shoutout to the hero of our subcamp!',
        //     criteria:
        //         'Earn the Subcamp Superhero badge by demonstrating exemplary community engagement, leadership, and support within your subcamp.',
        // },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.connoisseur.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.connoisseur.presetTitle']();
            },
            type: AchievementTypes.Connoisseur,
            get description() {
                return m['boostContent.subcategories.socialBadge.connoisseur.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.connoisseur.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.snoreMaster.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.snoreMaster.presetTitle']();
            },
            type: AchievementTypes.SnoreMaster,
            get description() {
                return m['boostContent.subcategories.socialBadge.snoreMaster.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.snoreMaster.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.insomniac.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.insomniac.presetTitle']();
            },
            type: AchievementTypes.Insomniac,
            get description() {
                return m['boostContent.subcategories.socialBadge.insomniac.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.insomniac.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.earlyBird.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.earlyBird.presetTitle']();
            },
            type: AchievementTypes.EarlyBird,
            get description() {
                return m['boostContent.subcategories.socialBadge.earlyBird.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.earlyBird.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.chef.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.chef.presetTitle']();
            },
            type: AchievementTypes.Chef,
            get description() {
                return m['boostContent.subcategories.socialBadge.chef.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.chef.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.griller.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.griller.presetTitle']();
            },
            type: AchievementTypes.Griller,
            get description() {
                return m['boostContent.subcategories.socialBadge.griller.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.griller.criteria']();
            },
        },
        // {
        //     title: 'Foodie',
        //     presetTitle: 'Food House Foodie',
        //     type: AchievementTypes.Foodie,
        //     description: 'Shoutout to the Scout dedicated to trying every food house!',
        //     criteria:
        //         'Earn the Food House Foodie badge by exploring and tasting diverse cuisines from a variety of food houses at the Jamboree.',
        // },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.hydrator.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.hydrator.presetTitle']();
            },
            type: AchievementTypes.Hydrator,
            get description() {
                return m['boostContent.subcategories.socialBadge.hydrator.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.hydrator.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.rescuer.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.rescuer.presetTitle']();
            },
            type: AchievementTypes.Rescuer,
            get description() {
                return m['boostContent.subcategories.socialBadge.rescuer.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.rescuer.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.scoutInfluencer.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.scoutInfluencer.presetTitle']();
            },
            type: AchievementTypes.ScoutInfluencer,
            get description() {
                return m['boostContent.subcategories.socialBadge.scoutInfluencer.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.scoutInfluencer.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.snapchatScout.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.snapchatScout.presetTitle']();
            },
            type: AchievementTypes.SnapchatScout,
            get description() {
                return m['boostContent.subcategories.socialBadge.snapchatScout.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.snapchatScout.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.instaGuru.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.instaGuru.presetTitle']();
            },
            type: AchievementTypes.InstaGuru,
            get description() {
                return m['boostContent.subcategories.socialBadge.instaGuru.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.instaGuru.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.socialBadge.tickTrendSetter.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.socialBadge.tickTrendSetter.presetTitle']();
            },
            type: AchievementTypes.TickTrendSetter,
            get description() {
                return m['boostContent.subcategories.socialBadge.tickTrendSetter.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.socialBadge.tickTrendSetter.criteria']();
            },
        },
    ],
    // copied over learning history types for now
    [BoostCategoryOptionsEnum.course]: [
        {
            get title() {
                return m['boostContent.subcategories.course.assignment.title']();
            },
            type: AchievementTypes.Assignment,
        },
        {
            get title() {
                return m['boostContent.subcategories.course.associateDegree.title']();
            },
            type: AchievementTypes.AssociateDegree,
        },
        {
            get title() {
                return m['boostContent.subcategories.course.bachelorDegree.title']();
            },
            type: AchievementTypes.BachelorDegree,
        },
        {
            get title() {
                return m['boostContent.subcategories.course.certificateOfCompletion.title']();
            },
            type: AchievementTypes.CertificateOfCompletion,
        },
        {
            get title() {
                return m['boostContent.subcategories.course.course.title']();
            },
            type: AchievementTypes.Course,
        },
        {
            get title() {
                return m['boostContent.subcategories.course.coCurricular.title']();
            },
            type: AchievementTypes.CoCurricular,
        },
        {
            get title() {
                return m['boostContent.subcategories.course.researchDoctorate.title']();
            },
            type: AchievementTypes.ResearchDoctorate,
        },

        // extended ( Learning History ) category types
        {
            get title() {
                return m['boostContent.subcategories.course.reportCard.title']();
            },
            type: AchievementTypes.ReportCard,
        },
        {
            get title() {
                return m['boostContent.subcategories.course.microDegree.title']();
            },
            type: AchievementTypes.MicroDegree,
        },
    ],
    // copied over work history sub categories for now
    [BoostCategoryOptionsEnum.job]: [
        {
            get title() {
                return m['boostContent.subcategories.job.apprenticeshipCertificate.title']();
            },
            type: AchievementTypes.ApprenticeshipCertificate,
        },
        {
            get title() {
                return m['boostContent.subcategories.job.fieldwork.title']();
            },
            type: AchievementTypes.Fieldwork,
        },
        {
            get title() {
                return m['boostContent.subcategories.job.journeymanCertificate.title']();
            },
            type: AchievementTypes.JourneymanCertificate,
        },
        {
            get title() {
                return m['boostContent.subcategories.job.masterCertificate.title']();
            },
            type: AchievementTypes.MasterCertificate,
        },

        // extended ( Work History ) category types
        {
            get title() {
                return m['boostContent.subcategories.job.job.title']();
            },
            type: AchievementTypes.Job,
        },
        {
            get title() {
                return m['boostContent.subcategories.job.internship.title']();
            },
            type: AchievementTypes.Internship,
        },
        {
            get title() {
                return m['boostContent.subcategories.job.volunteer.title']();
            },
            type: AchievementTypes.Volunteer,
        },
        {
            get title() {
                return m['boostContent.subcategories.job.fellowship.title']();
            },
            type: AchievementTypes.Fellowship,
        },
        {
            get title() {
                return m['boostContent.subcategories.job.board.title']();
            },
            type: AchievementTypes.Board,
        },
    ],
    [BoostCategoryOptionsEnum.meritBadge]: [
        {
            get title() {
                return m['boostContent.subcategories.meritBadge.archery.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.meritBadge.archery.presetTitle']();
            },
            type: AchievementTypes.Archery,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/Archery-qjjk7nbqjdp20a8bkyxk52eqcw9x9weiflmucyyp28.png',
            get description() {
                return m['boostContent.subcategories.meritBadge.archery.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.meritBadge.archery.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.meritBadge.astronomy.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.meritBadge.astronomy.presetTitle']();
            },
            type: AchievementTypes.Astronomy,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/Astronomy-qjjk7nbqjdp20a8bkyxk52eqcw9x9weiflmucyyp28.png',
            get description() {
                return m['boostContent.subcategories.meritBadge.astronomy.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.meritBadge.astronomy.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.meritBadge.chess.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.meritBadge.chess.presetTitle']();
            },
            type: AchievementTypes.Chess,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/Chess-qjjk7o9kq7qcbw6yfhc6pk66ya5ahli8rqabu8xaw0.png',
            get description() {
                return m['boostContent.subcategories.meritBadge.chess.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.meritBadge.chess.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.meritBadge.dogCare.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.meritBadge.dogCare.presetTitle']();
            },
            type: AchievementTypes.DogCare,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/DogCare-qjjk7nbqjdp20a8bkyxk52eqcw9x9weiflmucyyp28.png',
            get description() {
                return m['boostContent.subcategories.meritBadge.dogCare.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.meritBadge.dogCare.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.meritBadge.engineering.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.meritBadge.engineering.presetTitle']();
            },
            type: AchievementTypes.Engineering,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/Engineering-qjjk7o9kq7qcbw6yfhc6pk66ya5ahli8rqabu8xaw0.png',
            get description() {
                return m['boostContent.subcategories.meritBadge.engineering.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.meritBadge.engineering.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.meritBadge.music.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.meritBadge.music.presetTitle']();
            },
            type: AchievementTypes.Music,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/Music-qjjk7o9kq7qcbw6yfhc6pk66ya5ahli8rqabu8xaw0.png',
            get description() {
                return m['boostContent.subcategories.meritBadge.music.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.meritBadge.music.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.meritBadge.nuclearScience.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.meritBadge.nuclearScience.presetTitle']();
            },
            type: AchievementTypes.NuclearScience,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/NuclearScience-qjjk7p7ex1rmni5l9zqta1xnjo0npalz3uxtbivwps.png',
            get description() {
                return m['boostContent.subcategories.meritBadge.nuclearScience.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.meritBadge.nuclearScience.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.meritBadge.programming.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.meritBadge.programming.presetTitle']();
            },
            type: AchievementTypes.Programming,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/Programming-qjjk7p7ex1rmni5l9zqta1xnjo0npalz3uxtbivwps.png',
            get description() {
                return m['boostContent.subcategories.meritBadge.programming.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.meritBadge.programming.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.meritBadge.spaceExploration.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.meritBadge.spaceExploration.presetTitle']();
            },
            type: AchievementTypes.SpaceExploration,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/SpaceExploration-qjjk7o9kq7qcbw6yfhc6pk66ya5ahli8rqabu8xaw0.png',
            get description() {
                return m['boostContent.subcategories.meritBadge.spaceExploration.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.meritBadge.spaceExploration.criteria']();
            },
        },
        {
            get title() {
                return m['boostContent.subcategories.meritBadge.wildernessSurvival.title']();
            },
            get presetTitle() {
                return m['boostContent.subcategories.meritBadge.wildernessSurvival.presetTitle']();
            },
            type: AchievementTypes.WildernessSurvival,
            image: 'https://www.scouting.org/wp-content/uploads/elementor/thumbs/WildernessSurvival-qjjk7o9kq7qcbw6yfhc6pk66ya5ahli8rqabu8xaw0.png',
            get description() {
                return m['boostContent.subcategories.meritBadge.wildernessSurvival.description']();
            },
            get criteria() {
                return m['boostContent.subcategories.meritBadge.wildernessSurvival.criteria']();
            },
        },
    ],
};

export const defaultIDCardImage = 'https://svgur.com/i/w0y.svg';
export const defaultIssuerThumbnail = 'https://svgur.com/i/19Ma.svg';

export const defaultCategoryThumbImages = [
    'https://cdn.filestackcontent.com/wmy95gChQOmUXVBI24wV',
    'https://cdn.filestackcontent.com/EHl1PKEQTPuErCax48Uy',
    'https://cdn.filestackcontent.com/PCIwcDr5QgiiHPv5GYvY',
    'https://cdn.filestackcontent.com/2eR985mSrur9mK4V4mzQ',
    'https://cdn.filestackcontent.com/Otl66rNhTFu66mGf96Iq',
    'https://cdn.filestackcontent.com/9lKwrJdoRPmv9chLFJQv',
    'https://cdn.filestackcontent.com/EwXi4MnoT6eDgM6cmJuH',
];

export const BOOST_CATEGORY_TO_WALLET_ROUTE = {
    ['ID']: 'ids',
    ['Learning History']: 'learninghistory',
    ['Achievement']: 'achievements',
    ['Work History']: 'workhistory',
    ['Skill']: 'skills',
    ['Social Badge']: 'boosts',
    ['Membership']: 'troops',
    ['Merit Badge']: 'badges',
};
