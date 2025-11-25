import React from 'react';
import { useHistory } from 'react-router';

import AdminPageStructure from './AdminPageStructure';

const AdminToolsPage: React.FC = () => {
    const history = useHistory();

    return (
        <AdminPageStructure title="What you would you like to do, O Admin?" hideBackButton>
            <section className="flex flex-col gap-[20px]">
                <button
                    className="bg-white rounded-[20px] shadow-bottom px-[15px] py-[10px]"
                    onClick={() => history.push('/admin-tools/view-managed-boosts')}
                >
                    View All Managed Boosts and Badges
                </button>

                <button
                    className="bg-white rounded-[20px] shadow-bottom px-[15px] py-[10px]"
                    onClick={() => history.push('/admin-tools/bulk-import')}
                >
                    Bulk Import Badges + Boosts
                </button>
            </section>
        </AdminPageStructure>
    );
};

export default AdminToolsPage;
