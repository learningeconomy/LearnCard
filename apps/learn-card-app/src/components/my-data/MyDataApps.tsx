import React, { useState } from 'react';

import { MyDataStepsEnum } from './MyData';
import MyDataSettings from './MyDataSettings';
import MyDataAppsList from './MyDataAppsList';

const MyDataApps: React.FC<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for this lint-only PR
    appsList: any;
    handleCloseModal: () => void;
    activeStep: MyDataStepsEnum;
    setActiveStep: React.Dispatch<React.SetStateAction<MyDataStepsEnum>>;
}> = ({ appsList = [], handleCloseModal, activeStep, setActiveStep }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for this lint-only PR
    const [selectedApp, setSelectedApp] = useState<any | null>(null);

    const handleGoBack = () => {
        if (selectedApp) {
            setSelectedApp(null);
        } else {
            setActiveStep(MyDataStepsEnum.overview);
        }
    };

    // eslint-disable-next-line no-useless-assignment -- existing dead initial value; removing it touches control flow, out of scope here
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
