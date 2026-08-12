import { useHistory } from 'react-router-dom';
import type { FC } from 'react';

import { useModal } from 'learn-card-base';

import AdminToolsOptionItemHeader from '../AdminToolsModal/helpers/AdminToolsOptionItemHeader';
import type { AdminToolOption } from '../AdminToolsModal/admin-tools.helpers';

const AdminToolsLearnerContextTestOption: FC<{ option: AdminToolOption }> = ({ option }) => {
    const history = useHistory();
    const { closeAllModals } = useModal();

    const handleOpen = () => {
        closeAllModals();
        history.push('/admin-tools/learner-context-test');
    };

    return (
        <section className="h-full w-full flex items-start justify-center overflow-y-scroll pt-4">
            <section className="bg-white max-w-[800px] w-full rounded-[20px] overflow-hidden shadow-box-bottom">
                <AdminToolsOptionItemHeader option={option} onClick={handleOpen} />

                <div className="p-[20px] flex flex-col gap-[16px]">
                    <p className="text-[15px] text-grayscale-700 font-notoSans leading-[24px]">
                        Open a dedicated test page for the learner context formatter. You can choose
                        a backend URL, pick wallet credentials with a ConsentFlow-style selector,
                        and inspect the full JSON response.
                    </p>

                    <div className="rounded-[16px] bg-grayscale-50 border border-grayscale-200 p-[16px] flex flex-col gap-[8px]">
                        <p className="text-[15px] font-[600] text-grayscale-900 font-notoSans">
                            Included in the test flow
                        </p>
                        <p className="text-[14px] text-grayscale-600 font-notoSans">
                            Custom backend URL, selective credential picking, extra JSON context,
                            and a full prompt/response preview.
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleOpen}
                            className="rounded-full bg-emerald-700 text-white px-[18px] py-[12px] text-[15px] font-[600] font-notoSans"
                        >
                            Open Test UX
                        </button>
                    </div>
                </div>
            </section>
        </section>
    );
};

export default AdminToolsLearnerContextTestOption;
