import React, { useEffect, useRef, useState } from 'react';

import { IonInput, IonSpinner } from '@ionic/react';
import X from 'learn-card-base/svgs/X';
import Pencil from '../../components/svgs/Pencil';
import CodeIcon from 'learn-card-base/svgs/CodeIcon';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import SkinnyArrowLeft from 'learn-card-base/svgs/SkinnyArrowLeft';
import FrameworkSearchResults from './FrameworkSearchResults';

import { SetState } from 'packages/shared-types/dist';
import { ApiFrameworkInfo } from '../../helpers/skillFramework.helpers';
import { conditionalPluralize } from 'learn-card-base';
import { SkillFrameworkNode, SkillFrameworkNodeWithSearchInfo } from '../../components/boost/boost';

type BrowseFrameworkMultiColumnHeaderProps = {
    handleBack: () => void;
    backDisabled?: boolean;
    handleApprove: () => void;
    handleClose: () => void;
    search: string;
    searchResults: (SkillFrameworkNode | SkillFrameworkNodeWithSearchInfo)[];
    searchLoading: boolean;
    setSearch: SetState<string>;
    isApproveFlow?: boolean;
    changesExist?: boolean;
    useShortText?: boolean;
    openManageJsonModal?: () => void;
    isEdit: boolean;
    setIsEdit: SetState<boolean>;
    handleDisableEdit?: () => void;
    frameworkInfo: ApiFrameworkInfo;
    isFullScreenSearch?: boolean;
    setIsFullScreenSearch: SetState<boolean>;
    onSearchResultItemClick: (
        node: SkillFrameworkNode | SkillFrameworkNodeWithSearchInfo,
        path: SkillFrameworkNode[]
    ) => void;
    isSelectSkillsFlow?: boolean;
    selectedSkills?: SkillFrameworkNode[];
    handleToggleSkill?: (node: SkillFrameworkNode) => void;
    handleSaveSkills?: () => void;
    disableSave?: boolean;
};

const BrowseFrameworkMultiColumnHeader: React.FC<BrowseFrameworkMultiColumnHeaderProps> = ({
    handleBack,
    backDisabled,
    handleApprove,
    handleClose,
    search,
    setSearch,
    searchResults,
    searchLoading,
    isApproveFlow,
    changesExist,
    useShortText,
    openManageJsonModal,
    isEdit,
    setIsEdit,
    handleDisableEdit,
    frameworkInfo,
    isFullScreenSearch,
    setIsFullScreenSearch,
    onSearchResultItemClick,
    isSelectSkillsFlow,
    selectedSkills,
    handleToggleSkill,
    handleSaveSkills,
    disableSave,
}) => {
    const inputRef = useRef<HTMLIonInputElement>(null);
    const [showResults, setShowResults] = useState(false);

    // fixes some weird case where search results opens after clicking a search result item from fullscreen
    useEffect(() => {
        if (!search && showResults) {
            setShowResults(false);
        }
    }, [search, showResults]);

    return (
        <header className="flex items-center gap-[20px] p-[20px] border-b-[1px] border-grayscale-200 border-solid">
            <div className="flex items-center gap-[15px] pl-[10px] pr-[20px] border-r-[1px] border-grayscale-200 border-solid">
                <button
                    onClick={handleBack}
                    disabled={backDisabled}
                    className="text-grayscale-900 disabled:text-grayscale-400"
                >
                    <SkinnyArrowLeft version="2" />
                </button>
            </div>

            <div
                className={`flex items-center flex-1 gap-[20px] ${
                    isFullScreenSearch ? '' : 'max-w-[1244px] mx-auto'
                }`}
            >
                {isSelectSkillsFlow && (
                    <div className="flex items-center gap-[10px] px-[20px]">
                        <PuzzlePiece
                            version="filled"
                            className="w-[40px] h-[40px] shrink-0 text-grayscale-800"
                        />
                        <span className="text-[22px] font-poppins font-[600] leading-[24px] text-grayscale-900">
                            Add {conditionalPluralize(selectedSkills?.length || 0, 'Skill')}
                        </span>
                    </div>
                )}
                <div className="relative flex-1">
                    <div className="relative">
                        <IonInput
                            ref={inputRef}
                            className="bg-grayscale-100 text-grayscale-800 rounded-[10px] ion-padding font-poppins text-[14px] w-full !pr-[24px]"
                            placeholder="Search framework..."
                            value={search}
                            onIonInput={e => {
                                const value = e.detail.value || '';
                                setSearch(value);
                                setShowResults(value.length > 0);
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    setIsFullScreenSearch(true);
                                }
                            }}
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    setShowResults(false);
                                    inputRef.current?.setFocus();
                                }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-grayscale-600 hover:text-grayscale-800 transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    {showResults && !isFullScreenSearch && (
                        <div
                            className="absolute z-10 max-h-[70vh] bg-white border border-t-0 border-gray-200 rounded-b-[15px] shadow-lg overflow-y-auto p-[20px]"
                            style={{
                                width: inputRef.current?.offsetWidth || '100%',
                                left: 0,
                                right: 0,
                            }}
                        >
                            {searchLoading && !isApproveFlow && (
                                <div className="h-[100px] w-full flex items-center justify-center">
                                    <IonSpinner color="dark" name="crescent" />
                                </div>
                            )}
                            {(!searchLoading || isApproveFlow) && (
                                <FrameworkSearchResults
                                    searchResults={searchResults}
                                    frameworkInfo={frameworkInfo}
                                    onClick={(node, path) => {
                                        setShowResults(false);
                                        onSearchResultItemClick(node, path);
                                    }}
                                    isSelectSkillsFlow={isSelectSkillsFlow}
                                    selectedSkills={selectedSkills}
                                    handleToggleSkill={handleToggleSkill}
                                />
                            )}
                        </div>
                    )}
                </div>

                {!isFullScreenSearch && (
                    <>
                        <div
                            className={`${
                                isSelectSkillsFlow ? 'max-w-[300px]' : ''
                            } flex gap-[10px] flex-1`}
                        >
                            {isEdit && (
                                <>
                                    {!isApproveFlow && (
                                        <button
                                            onClick={handleDisableEdit}
                                            className="bg-white flex items-center justify-center gap-[5px] rounded-[30px] px-[20px] py-[7px] border-[1px] border-grayscale-200 border-solid shadow-bottom-3-4 font-poppins text-[17px] line-clamp-1 flex-1"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button
                                        onClick={handleApprove}
                                        className="bg-emerald-700 disabled:bg-grayscale-200 text-white font-[600] flex items-center justify-center rounded-[30px] px-[20px] py-[7px] font-poppins text-[17px] line-clamp-1 flex-1"
                                        disabled={!changesExist && !isApproveFlow}
                                    >
                                        {isApproveFlow && (
                                            <>{useShortText ? 'Approve' : 'Approve Framework'}</>
                                        )}
                                        {!isApproveFlow && (
                                            <>{useShortText ? 'Save' : 'Save Framework'}</>
                                        )}
                                    </button>
                                </>
                            )}
                            {isSelectSkillsFlow && (
                                <>
                                    <button
                                        onClick={handleSaveSkills}
                                        className="bg-emerald-700 disabled:bg-grayscale-200 text-white font-[600] flex items-center justify-center rounded-[30px] px-[20px] py-[7px] font-poppins text-[17px] line-clamp-1 flex-1 h-full"
                                        disabled={disableSave}
                                    >
                                        Save
                                    </button>
                                </>
                            )}
                            {!isEdit && !isSelectSkillsFlow && (
                                <>
                                    <button
                                        onClick={() => setIsEdit(true)}
                                        className="bg-white flex items-center justify-center gap-[5px] rounded-[30px] px-[20px] py-[7px] border-[1px] border-grayscale-200 border-solid shadow-bottom-3-4 font-poppins text-[17px] line-clamp-1 flex-1"
                                    >
                                        <Pencil
                                            version={3}
                                            className="w-[25px] h-[25px] shrink-0"
                                        />
                                        {useShortText ? 'Edit' : 'Edit Framework'}
                                    </button>
                                    <button
                                        onClick={openManageJsonModal}
                                        className="bg-white flex items-center justify-center gap-[5px] rounded-[30px] px-[20px] py-[7px] border-[1px] border-grayscale-200 border-solid shadow-bottom-3-4 font-poppins text-[17px] line-clamp-1 flex-1"
                                    >
                                        <CodeIcon
                                            className="w-[25px] h-[25px] shrink-0"
                                            version="with-slash"
                                        />
                                        {useShortText ? 'JSON' : 'Manage JSON'}
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>

            {!isFullScreenSearch && (
                <button onClick={handleClose}>
                    <X className="w-[25px] h-[25px] text-grayscale-800 ml-auto" />
                </button>
            )}
        </header>
    );
};

export default BrowseFrameworkMultiColumnHeader;
