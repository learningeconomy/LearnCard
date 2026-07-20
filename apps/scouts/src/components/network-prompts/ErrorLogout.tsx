import { IonLoading, IonRow, IonCol } from '@ionic/react';
import useLogout from '../../hooks/useLogout';
import { BrandingEnum } from 'learn-card-base';
import * as m from '../../paraglide/messages.js';

const ErrorLogout: React.FC = () => {
    const { handleLogout, isLoggingOut } = useLogout();

    const _handleLogout = () => {
        handleLogout(BrandingEnum.scoutPass);
    };

    return (
        <div className="w-full h-full transparent flex items-center justify-center">
            <IonRow className="flex h-full flex-col items-center justify-center px-[20px]">
                <div
                    className={`shadow-3xl relative p-[20px] flex w-full max-w-[400px] flex-col items-start justify-start overflow-hidden rounded-[20px] bg-white`}
                >
                    <div className="w-full overflow-y-scroll">
                        <p className="font-medium mb-[30px]">
                            {m['networkPrompts.errorLogout.msg']()}
                        </p>
                        <button
                            onClick={_handleLogout}
                            className="flex items-center justify-center text-white rounded-full px-[18px] py-[12px] bg-sp-purple-base text-2xl w-full shadow-lg"
                        >
                            {m['networkPrompts.errorLogout.logoutBtn']()}
                        </button>
                    </div>
                </div>
            </IonRow>
        </div>
    );
};

export default ErrorLogout;
