import React, { useState } from 'react';

import { MyDataStepsEnum } from './MyData';
import MyDataSettings from './MyDataSettings';
import MyDataAppsList from './MyDataAppsList';

const MyDataApps: React.FC<{
    appsList: any;
    handleCloseModal: () => void;
    activeStep: MyDataStepsEnum;
    setActiveStep: React.Dispatch<React.SetStateAction<MyDataStepsEnum>>;
}> = ({ appsList = [], handleCloseModal, activeStep, setActiveStep }) => {
    const [selectedApp, setSelectedApp] = useState<any | null>(null);

    const handleGoBack = () => {
        if (selectedApp) {
            setSelectedApp(null);
        } else {
            setActiveStep(MyDataStepsEnum.overview);
        }
    };

    let activeStepEl = null;

    if (selectedApp) {
        activeStepEl = <MyDataSettings selectedItem={selectedApp} handleGoBack={handleGoBack} />;
    } else {
        activeStepEl = (
            <MyDataAppsList
                appsList={appsList}
                setSelectedApp={setSelectedApp}
                handleGoBack={handleGoBack}
            />
        );
    }

    return activeStepEl;
};

export default MyDataApps;
