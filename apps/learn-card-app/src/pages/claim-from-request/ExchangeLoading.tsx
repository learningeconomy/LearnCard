import * as m from '../../paraglide/messages.js';
import { AppContent, AppPage } from '../../components/chrome';
import { AppSpinner } from '../../components/feedback/AppSpinner';

const ExchangeLoading = () => {
    return (
        <AppPage>
            <AppContent fullscreen>
                <div className="min-h-full bg-grayscale-100 flex flex-col items-center justify-center p-4 font-poppins">
                    <AppSpinner name="crescent" className="text-emerald-600 w-8 h-8 mb-4" />
                    <p className="text-sm text-grayscale-600 font-medium">
                        {m['common.loading']()}
                    </p>
                </div>
            </AppContent>
        </AppPage>
    );
};

export default ExchangeLoading;
