import React from 'react';
import * as m from '../../paraglide/messages.js';
import { useHistory } from 'react-router';

import AdminPageStructure from './AdminPageStructure';

const AdminToolsPage: React.FC = () => {
    const history = useHistory();

    return (
        <AdminPageStructure title={m['adminTools.whatWouldYouLike']()} hideBackButton>
            <section className="flex flex-col gap-[20px]">
                <button
                    className="bg-white rounded-[20px] shadow-bottom px-[15px] py-[10px]"
                    onClick={() => history.push('/admin-tools/view-managed-boosts')}
                >
                    {m['adminTools.viewAllManagedBoosts']()}
                </button>

                <button
                    className="bg-white rounded-[20px] shadow-bottom px-[15px] py-[10px]"
                    onClick={() => history.push('/admin-tools/bulk-import')}
                >
                    {m['adminTools.bulkImportBadges']()}
                </button>
            </section>
        </AdminPageStructure>
    );
};

export default AdminToolsPage;
