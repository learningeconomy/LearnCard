import React, { useState } from 'react';

import MyDataOverview from './MyDataOverview';
import MyDataApps from './MyDataApps';

import KhanAcademyLogo from 'learn-card-base/assets/images/KhanAcademy.png';
import CourseraLogo from 'learn-card-base/assets/images/Coursera.png';
import SuperSkillsLogo from 'learn-card-base/assets/images/superskills.png';
import BrookingsLogo from 'learn-card-base/assets/images/Brookings.png';

export enum MyDataStepsEnum {
    overview = 'overview',
    apps = 'apps',
    schools = 'schools',
    jobs = 'jobs',
}

const APPS = [{
    name: 'Khan Academy',
    image: KhanAcademyLogo,
    settings: {
        read: [],
        write: []
    }
}, {
    name: 'Coursera',
    image: CourseraLogo,
    settings: {
        read: [],
        write: []
    }
}, 
{
    name: 'Super Skills!',
    image: SuperSkillsLogo,
    settings: {
        read: [],
        write: []
    }
}, {
    name: 'Brookings',
    image: BrookingsLogo,
    settings: {
        read: [],
        write: []
    }
}];

const MyData: React.FC<{ handleCloseModal: () => void }> = ({ handleCloseModal }) => {
    const [activeStep, setActiveStep] = useState<MyDataStepsEnum>(MyDataStepsEnum.overview);

    let activeStepEl = null;

    switch (activeStep) {
        case MyDataStepsEnum.overview:
            activeStepEl = (
                <MyDataOverview
                    handleCloseModal={handleCloseModal}
                    activeStep={activeStep}
                    setActiveStep={setActiveStep}
                />
            );
            break;

        case MyDataStepsEnum.apps:
            activeStepEl = (
                <MyDataApps
                    appsList={APPS}
                    handleCloseModal={handleCloseModal}
                    activeStep={activeStep}
                    setActiveStep={setActiveStep}
                />
            );
            break;

        default:
            activeStepEl = (
                <MyDataOverview
                    handleCloseModal={handleCloseModal}
                    activeStep={activeStep}
                    setActiveStep={setActiveStep}
                />
            );
            break;
    }

    return activeStepEl;
};

export default MyData;
