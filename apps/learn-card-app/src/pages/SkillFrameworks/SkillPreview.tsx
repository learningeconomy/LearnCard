import React, { useState, useRef, useEffect } from 'react';
import { useModal } from 'learn-card-base';
import { IonFooter, IonInput } from '@ionic/react';
import {
    FrameworkNodeRole,
    SkillFramework,
    SkillFrameworkNode,
} from 'apps/learn-card-app/src/components/boost/boost';
import SkillsFrameworkIcon from 'apps/learn-card-app/src/components/svgs/SkillsFrameworkIcon';
import TiersAndCompetencies from './TiersAndCompetencies';
import FrameworkImage from './FrameworkImage';
import SlimCaretLeft from 'apps/learn-card-app/src/components/svgs/SlimCaretLeft';
import PuzzlePiece from 'learn-card-base/svgs/PuzzlePiece';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import Pencil from 'apps/learn-card-app/src/components/svgs/Pencil';

type SkillPreviewProps = {
    framework: SkillFramework;
    successButtonText?: string;
    onSuccess?: () => void;
};

const SkillPreview: React.FC<SkillPreviewProps> = ({
    framework,
    successButtonText = 'Approve',
    onSuccess,
}) => {
    const { closeModal } = useModal();

    const [search, setSearch] = useState('');
    const [navigationPath, setNavigationPath] = useState<SkillFrameworkNode[]>([]);

    const currentNodes =
        navigationPath.length > 0
            ? navigationPath[navigationPath.length - 1].subskills ?? []
            : framework.skills;

    const isTopLevel = navigationPath.length === 0;
    const previousNode = isTopLevel ? null : navigationPath[navigationPath.length - 1];

    // Count competencies in a single node and its subskills
    const countCompetenciesInNode = (node: SkillFrameworkNode | null): number => {
        if (!node) return 0;

        let count = node.role === FrameworkNodeRole.competency ? 1 : 0;

        if (node.subskills) {
            count += node.subskills.reduce(
                (sum, subskill) => sum + countCompetenciesInNode(subskill),
                0
            );
        }

        return count;
    };

    // Count all competencies in the entire framework
    const countCompetencies = (): number => {
        if (!framework?.skills?.length) return 0;
        return framework.skills.reduce((total, skill) => total + countCompetenciesInNode(skill), 0);
    };

    const totalCompetencies = countCompetencies();
    const competenciesInCurrentNode = countCompetenciesInNode(previousNode);

    const containerRef = useRef<HTMLDivElement>(null);
    const [availableWidth, setAvailableWidth] = useState(0);

    // Measure container width on mount and window resize
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                // Account for padding and other elements in the container
                const container = containerRef.current.parentElement?.parentElement;
                if (container) {
                    const style = window.getComputedStyle(container);
                    const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
                    setAvailableWidth(container.clientWidth - padding - 80); // 80px for icons and other elements
                }
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const breadcrumbText = React.useMemo(() => {
        const length = navigationPath.length;
        if (length === 0) return '';

        const lastItem = navigationPath[length - 1].targetName;
        if (length === 1) return lastItem;

        const secondLast = navigationPath[length - 2].targetName;

        // Function to estimate text width
        const getTextWidth = (text: string) => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) return text.length * 8; // Fallback: ~8px per character
            context.font = '600 14px Poppins';
            return context.measureText(text).width;
        };

        // Start with full text and reduce until it fits
        let truncatedSecondLast = secondLast;
        const lastItemWidth = getTextWidth(lastItem);
        const ellipsisWidth = getTextWidth('... > ');
        let maxSecondLastWidth = availableWidth - lastItemWidth - ellipsisWidth - 20; // 20px buffer

        if (getTextWidth(secondLast) > maxSecondLastWidth) {
            // Binary search for optimal truncation
            let low = 4; // Minimum 4 characters
            let high = secondLast.length;
            let bestLength = 4;

            while (low <= high) {
                const mid = Math.floor((low + high) / 2);
                const truncated = secondLast.substring(0, mid) + '...';
                const width = getTextWidth(truncated);

                if (width <= maxSecondLastWidth) {
                    bestLength = mid;
                    low = mid + 1;
                } else {
                    high = mid - 1;
                }
            }

            truncatedSecondLast =
                bestLength < secondLast.length
                    ? secondLast.substring(0, bestLength) + '...'
                    : secondLast;
        }

        const result =
            length > 2
                ? `... > ${truncatedSecondLast} > ${lastItem}`
                : `${truncatedSecondLast} > ${lastItem}`;

        return result;
    }, [navigationPath, availableWidth]);

    const navPathTitle = navigationPath.map(n => n.targetName).join(' > ');

    return (
        <div className="h-full relative bg-grayscale-50 overflow-hidden">
            <div className="px-[15px] py-[10px] bg-white safe-area-top-margin flex flex-col gap-[10px] z-20 relative border-b-[1px] border-grayscale-200 border-solid">
                <div className="flex items-center gap-[10px]">
                    {isTopLevel ? (
                        <FrameworkImage
                            image={framework?.image}
                            sizeClassName="w-[60px] h-[60px]"
                            iconSizeClassName="w-[28px] h-[28px]"
                        />
                    ) : (
                        <div className="rounded-full bg-grayscale-900 w-[60px] h-[60px] flex items-center justify-center p-[12px]">
                            <span className="text-[28px] h-[36px] w-[36px] leading-[36px] font-fluentEmoji cursor-none pointer-events-none select-none">
                                {previousNode?.icon}
                            </span>
                        </div>
                    )}
                    <div className="flex flex-col items-start justify-center">
                        <h5 className="text-[17px] text-grayscale-900 font-poppins line-clamp-2 leading-[130%]">
                            {previousNode?.targetName || framework.name}
                        </h5>
                        <span className="text-grayscale-800 font-poppins font-[700] text-[12px] flex items-center gap-[5px]">
                            {isTopLevel && 'Framework • '}
                            <span className="flex items-center gap-[2px]">
                                <PuzzlePiece version="filled" />
                                {isTopLevel ? totalCompetencies : competenciesInCurrentNode} Skills
                            </span>
                        </span>
                    </div>
                    {isTopLevel ? (
                        <button
                            className="ml-auto"
                            // onClick={openEditFrameworkModal}
                        >
                            <ThreeDots className="w-[22px] h-[22px] text-grayscale-600" />
                        </button>
                    ) : (
                        <button className="ml-auto">
                            <Pencil className="w-[24px] h-[24px] text-grayscale-600" />
                        </button>
                    )}
                </div>

                {navigationPath.length > 0 && (
                    <div
                        ref={containerRef}
                        className="py-[5px] flex gap-[5px] items-center w-full overflow-hidden"
                    >
                        <button onClick={() => setNavigationPath([])}>
                            <SkillsFrameworkIcon
                                className="!flex-shrink-0 w-[25px] h-[25px] text-grayscale-600"
                                color="currentColor"
                                version="outlined"
                            />
                        </button>
                        <div className="flex items-center gap-[5px] text-grayscale-600 font-poppins font-[600] text-[14px] truncate">
                            {breadcrumbText.split('>').map((part, index, parts) => {
                                const partText = part.trim();
                                if (!partText) return null;

                                const isCurrent = index === parts.length - 1;
                                const isEllipsis = partText === '...';
                                const pathIndex = navigationPath.length - (parts.length - index);

                                // Calculate the navigation target
                                const onClick = () => {
                                    if (isEllipsis) {
                                        // Go back 2 steps, but not beyond the start of the array
                                        const newLength = Math.max(0, navigationPath.length - 2);
                                        setNavigationPath(navigationPath.slice(0, newLength));
                                    } else if (!isCurrent) {
                                        setNavigationPath(navigationPath.slice(0, pathIndex + 1));
                                    }
                                };

                                return (
                                    <div key={index} className="flex items-center">
                                        {index > 0 && <span className="mx-[3px]">›</span>}
                                        {isCurrent ? (
                                            <span className="" title={navPathTitle}>
                                                {partText}
                                            </span>
                                        ) : (
                                            <button
                                                onClick={onClick}
                                                className="hover:underline"
                                                title={navPathTitle}
                                            >
                                                {partText}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <section className="h-full flex flex-col gap-[10px] pt-[15px] px-[20px] pb-[170px] overflow-y-auto z-0">
                <IonInput
                    className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-poppins text-[14px] w-full"
                    placeholder="Search framework..."
                    value={search}
                    onIonInput={e => setSearch(e.detail.value)}
                />

                <TiersAndCompetencies
                    framework={framework}
                    nodes={currentNodes}
                    setSelectedNode={node => {
                        // Supports SetStateAction<SkillFrameworkNode | null>
                        if (typeof node === 'function') {
                            const computed = (
                                node as (
                                    prev: SkillFrameworkNode | null
                                ) => SkillFrameworkNode | null
                            )(null);
                            if (computed) setNavigationPath([...navigationPath, computed]);
                            return;
                        }
                        const selected = node as SkillFrameworkNode | null;
                        if (!selected) return;
                        setNavigationPath([...navigationPath, selected]);
                    }}
                />
            </section>

            <IonFooter
                mode="ios"
                className="w-full flex justify-center items-center bg-opacity-80 backdrop-blur-[5px] p-[20px] absolute bottom-0 left-0 bg-white border-solid border-[1px] border-white"
            >
                <div className="w-full flex items-center justify-center gap-[10px] max-w-[600px]">
                    {navigationPath.length > 0 && (
                        <button
                            onClick={() => setNavigationPath(navigationPath.slice(0, -1))}
                            className="bg-white rounded-full text-grayscale-900 shadow-button-bottom flex items-center justify-center h-[44px] w-[44px]"
                        >
                            <SlimCaretLeft className="w-[20px] h-[20px]" />
                        </button>
                    )}
                    <button
                        onClick={closeModal}
                        className="p-[11px] bg-white rounded-full text-grayscale-900 shadow-button-bottom flex-1 font-poppins text-[17px]"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => {
                            onSuccess?.();
                            closeModal();
                        }}
                        className="px-[15px] py-[7px] bg-emerald-700 text-white rounded-[30px] text-[17px] font-[600] font-poppins leading-[24px] tracking-[0.25px] shadow-button-bottom h-[44px] flex-1"
                    >
                        {successButtonText}
                    </button>
                </div>
            </IonFooter>
        </div>
    );
};

export default SkillPreview;
