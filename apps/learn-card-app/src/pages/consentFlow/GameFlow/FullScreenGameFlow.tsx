import React, { useEffect, useState } from 'react';
import queryString from 'query-string';
import { useHistory, useLocation } from 'react-router-dom';
import useGetFamilyCredential from 'apps/learn-card-app/src/hooks/useGetFamilyCredential';
import usePin from 'apps/learn-card-app/src/hooks/usePin';

import { useModal, useIsLoggedIn, switchedProfileStore } from 'learn-card-base';

import GameLogin from './GameLogin';
import AddGamePrompt from './AddGamePrompt';
import AccountSwitcherModal from 'apps/learn-card-app/src/components/learncard/AccountSwitcherModal';
import AddGameConfirmationPrompt from './AddGameConfirmationPrompt';
import GameAccessSuccessPrompt from './GameAccessSuccessPrompt';
import CreateFamilyGamePrompt from './CreateFamilyGamePrompt';
import ReturnToGamePrompt from './ReturnToGamePrompt';

import { ConsentFlowContractDetails, LCNProfile } from '@learncard/types';

enum GameFlowStep {
    landing = 'landing',
    login = 'login',
    createFamily = 'createFamily',
    whosPlaying = 'selectPlayer',
    confirmation = 'confirmation',
    success = 'success',
    backToGame = 'backToGame',
}

type FullScreenGameFlowProps = {
    contractDetails?: ConsentFlowContractDetails;
    isPreview?: boolean;
};

const FullScreenGameFlow: React.FC<FullScreenGameFlowProps> = ({ contractDetails, isPreview }) => {
    const history = useHistory();
    const location = useLocation();
    const pathName = location?.pathname?.replace('/', '');
    const isFromGame = pathName === 'consent-flow'; // assume they came here directly from the game for consent-flow route

    const { closeModal } = useModal();

    const isLoggedIn = useIsLoggedIn();

    const { step: urlStep } = queryString.parse(location.search);
    const [step, setStep] = useState<GameFlowStep>(
        (urlStep as GameFlowStep) || GameFlowStep.landing
    );
    const [prevStep, setPrevStep] = useState<GameFlowStep>(GameFlowStep.landing);
    const [selectedUser, setSelectedUser] = useState<LCNProfile>();

    const isSwitchedProfile = switchedProfileStore.use.isSwitchedProfile();

    const { familyCredential } = useGetFamilyCredential();
    const hasFamily = !!familyCredential || isSwitchedProfile;

    useEffect(() => {
        // update url 'step' param every time step changes
        const searchParams = new URLSearchParams(window.location.search);
        searchParams.set('step', step);
        history.push({
            search: searchParams.toString(),
        });
    }, [step]);

    const { handleVerifyParentPin } = usePin(closeModal);

    const handleImAnAdult = async () => {
        if (isSwitchedProfile) {
            // switchAccount to parent so we can see all available profiles
            //   also, they did *just say* that they were the adult
            await handleVerifyParentPin();
        }

        if (!isLoggedIn) {
            // if NOT logged in, prompt the user to log in
            setStep(GameFlowStep.login);
        } else if (!hasFamily) {
            // if the user is not part of a family, prompt the user to "Create a family"
            setStep(GameFlowStep.createFamily);
        } else {
            // if the current user is logged in and part of a family prompt the user to select "Who's Playing?"
            setStep(GameFlowStep.whosPlaying);
        }
    };

    const handleBackToGame = () => {
        setPrevStep(step);
        setStep(GameFlowStep.backToGame);
    };

    const returnToPrevStep = () => {
        setStep(prevStep);
    };

    // navigation after logging in
    useEffect(() => {
        if (isLoggedIn && step === GameFlowStep.login) {
            setStep(hasFamily ? GameFlowStep.whosPlaying : GameFlowStep.createFamily);
        } else if (hasFamily && step === GameFlowStep.createFamily) {
            setStep(GameFlowStep.whosPlaying);
        }
    }, [isLoggedIn, hasFamily]);

    // navigate back to landing page if they're on some post-login page without being logged in
    //   can happen if they're not logged in, but the "step" url param is set
    useEffect(() => {
        const needsLoginSteps = [
            GameFlowStep.createFamily,
            GameFlowStep.whosPlaying,
            GameFlowStep.confirmation,
            GameFlowStep.success,
        ];
        if (!isLoggedIn && needsLoginSteps.includes(step)) {
            setStep(GameFlowStep.landing);
        }
    }, [isLoggedIn, step]);

    const stepToComponent = {
        [GameFlowStep.landing]: (
            <AddGamePrompt
                contractDetails={contractDetails}
                isFromGame={isFromGame}
                handleImAnAdult={handleImAnAdult}
                handleBackToGame={handleBackToGame}
                isPreview={isPreview}
            />
        ),
        [GameFlowStep.login]: <GameLogin handleBackToGame={handleBackToGame} />,
        [GameFlowStep.createFamily]: (
            <CreateFamilyGamePrompt
                contractDetails={contractDetails}
                onFamilyCreationSuccess={() => setStep(GameFlowStep.whosPlaying)}
                handleBackToGame={handleBackToGame}
                isFromGame={isFromGame}
            />
        ),
        [GameFlowStep.whosPlaying]: (
            <AccountSwitcherModal
                title="Who's Playing?"
                showFooter
                handlePlayerSwitchOverride={user => {
                    setSelectedUser(user);
                    setStep(GameFlowStep.confirmation);
                }}
                contractDetails={contractDetails}
                handleBackToGame={handleBackToGame}
                isFromGame={isFromGame}
            />
        ),
        [GameFlowStep.confirmation]: selectedUser ? (
            <AddGameConfirmationPrompt
                user={selectedUser}
                contractDetails={contractDetails}
                isFromGame={isFromGame}
                onAllowAccessSuccess={() => {
                    setStep(GameFlowStep.success);
                }}
                handleBackToGame={handleBackToGame}
                handleSelectADifferentPlayer={() => setStep(GameFlowStep.whosPlaying)}
            />
        ) : null,
        [GameFlowStep.success]: selectedUser ? (
            <GameAccessSuccessPrompt
                user={selectedUser}
                contractDetails={contractDetails}
                isFromGame={isFromGame}
            />
        ) : null,
        [GameFlowStep.backToGame]: (
            <ReturnToGamePrompt
                contractDetails={contractDetails}
                returnToPrevStep={returnToPrevStep}
            />
        ),
    };

    return (
        <div
            className="min-h-screen h-full w-full bg-cover bg-emerald-700"
            style={{
                backgroundImage: `url(${contractDetails?.image})`,
            }}
        >
            <div className="min-h-screen w-full bg-black bg-opacity-20 backdrop-blur-[5px] flex items-start justify-center overflow-y-auto">
                <div className="p-[30px] max-w-[400px] w-full">{stepToComponent[step]}</div>
            </div>
        </div>
    );
};

export default FullScreenGameFlow;
