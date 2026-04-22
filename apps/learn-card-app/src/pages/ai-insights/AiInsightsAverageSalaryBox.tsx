import React, { useState, useEffect, useRef } from 'react';

import type { OccupationDetailsResponse } from 'learn-card-base';
import { ModalTypes, useDeviceTypeByWidth, useModal } from 'learn-card-base';

import CaretDown from 'src/components/svgs/CaretDown';
import AiPathwayCareerPipeChart from '../ai-pathways/ai-pathway-careers/AiPathwayCareerPipeChart';
import {
    buildSalaryDistributionData,
    formatAboutCount,
    formatSalaryAmount,
    getSelectedWagesBySalaryType,
} from '../ai-pathways/ai-pathway-careers/ai-pathway-careers.helpers';
import AiInsightsRoleMenu from './AiInsightsRoleMenu';

type AiInsightsAverageSalaryBoxProps = {
    professionalTitle: string;
    occupation?: OccupationDetailsResponse;
    suggestedOccupations: OccupationDetailsResponse[];
    isLoading?: boolean;
    salaryType?: 'per_year' | 'per_hour';
};

const AiInsightsAverageSalaryBox: React.FC<AiInsightsAverageSalaryBoxProps> = ({
    professionalTitle,
    occupation,
    suggestedOccupations,
    isLoading = false,
    salaryType = 'per_year',
}) => {
    const [selectedOccupation, setSelectedOccupation] = useState<
        OccupationDetailsResponse | undefined
    >(occupation);
    const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
    const roleMenuRef = useRef<HTMLDivElement | null>(null);
    const { isMobile } = useDeviceTypeByWidth();
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.None,
        mobile: ModalTypes.BottomSheet,
    });

    useEffect(() => {
        setSelectedOccupation(occupation);
    }, [occupation]);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (
                isRoleMenuOpen &&
                roleMenuRef.current &&
                !roleMenuRef.current.contains(event.target as Node)
            ) {
                setIsRoleMenuOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
        };
    }, [isRoleMenuOpen]);

    const activeOccupation = selectedOccupation ?? occupation;

    const selectedWages = activeOccupation
        ? getSelectedWagesBySalaryType(activeOccupation?.Wages?.NationalWagesList || [], salaryType)
        : undefined;
    const projection = activeOccupation?.Projections?.Projections?.[0];
    const salaryDistributionData =
        activeOccupation && selectedWages
            ? buildSalaryDistributionData(
                  selectedWages,
                  projection?.EstimatedEmployment,
                  salaryType
              )
            : [];
    const medianBucketEmployment = salaryDistributionData.find(
        bucket => bucket.isMedianBucket
    )?.estimatedPeople;
    const totalEmploymentCount = formatAboutCount(projection?.EstimatedEmployment);

    const minSalary = selectedWages?.Pct10;
    const medianSalary = selectedWages?.Median;
    const maxSalary = selectedWages?.Pct90;
    const formattedMedianSalary = formatSalaryAmount(medianSalary, false, salaryType);
    const formattedMinSalary = formatSalaryAmount(minSalary, true, salaryType);
    const formattedMaxSalary = formatSalaryAmount(maxSalary, true, salaryType);
    const medianBucketEmploymentCount = formatAboutCount(medianBucketEmployment);
    const title = activeOccupation?.OnetTitle?.trim() || professionalTitle.trim() || 'Career';
    const pluralizedTitle = title.toLowerCase().endsWith('s')
        ? title.toLowerCase()
        : `${title.toLowerCase()}s`;
    const salaryTypeLabel = salaryType === 'per_hour' ? '/hr' : '/yr';

    const handleChooseRole = () => {
        if (suggestedOccupations.length === 0) {
            return;
        }

        if (isMobile) {
            setIsRoleMenuOpen(true);

            newModal(
                <AiInsightsRoleMenu
                    selectedOccupation={selectedOccupation ?? null}
                    setSelectedOccupation={nextOccupation => {
                        setSelectedOccupation(nextOccupation);
                        closeModal();
                    }}
                    suggestedOccupations={suggestedOccupations}
                    salaryType={salaryType}
                    variant="sheet"
                    onSelectOccupation={nextOccupation => {
                        setSelectedOccupation(nextOccupation);
                        closeModal();
                    }}
                />,
                {
                    onClose: () => setIsRoleMenuOpen(false),
                }
            );

            return;
        }

        setIsRoleMenuOpen(open => !open);
    };

    return (
        <div className="relative flex flex-col gap-[30px] w-full max-w-[600px] mx-auto rounded-[15px] bg-white py-[25px] px-[15px] shadow-bottom-4-4 overflow-visible">
            <h2 className="text-[18px] font-bold text-grayscale-900 font-poppins text-left leading-[24px] tracking-[0.32px]">
                Average Salaries
            </h2>

            <div className="rounded-[10px] border-[1px] border-solid border-grayscale-200 bg-grayscale-50 p-[10px] flex flex-col gap-[10px] items-start">
                <div className="relative flex items-start gap-[10px] w-full" ref={roleMenuRef}>
                    <p className="min-w-0 text-[17px] font-bold text-grayscale-800 font-poppins truncate">
                        {title}
                    </p>
                    <button
                        type="button"
                        aria-label="Choose role"
                        aria-expanded={isRoleMenuOpen}
                        onClick={handleChooseRole}
                        className={`ml-auto flex h-[30px] w-[30px] items-center justify-center rounded-full transition-colors p-[5px] ${
                            isRoleMenuOpen ? 'bg-grayscale-200' : 'bg-transparent'
                        }`}
                    >
                        <CaretDown className="h-[25px] w-[25px]" version="2" />
                    </button>

                    {isRoleMenuOpen && suggestedOccupations.length > 0 && !isMobile && (
                        <div className="absolute right-0 top-full z-20 mt-[8px] w-[min(460px,calc(100vw-32px))]">
                            <AiInsightsRoleMenu
                                selectedOccupation={selectedOccupation ?? null}
                                setSelectedOccupation={nextOccupation => {
                                    setSelectedOccupation(nextOccupation);
                                    setIsRoleMenuOpen(false);
                                }}
                                suggestedOccupations={suggestedOccupations}
                                salaryType={salaryType}
                            />
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <p className="text-sm text-grayscale-600">Finding salary data...</p>
                ) : activeOccupation && selectedWages ? (
                    <>
                        <p className="flex flex-wrap items-end gap-1 leading-none">
                            <span className="text-[21px] font-bold bg-[linear-gradient(90deg,#6366F1_0%,#818CF8_98.7%)] bg-clip-text text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent]">
                                {formattedMedianSalary}
                            </span>
                            <span className="text-[12px] text-grayscale-700 leading-[16px]">
                                {salaryTypeLabel} average
                            </span>
                        </p>

                        <div className="flex flex-col items-start text-[12px] text-grayscale-600 font-bold">
                            <p>
                                Range: {formattedMinSalary} - {formattedMaxSalary}
                            </p>

                            {totalEmploymentCount && (
                                <p className="text-left">
                                    About {totalEmploymentCount} {pluralizedTitle} worldwide
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-grayscale-600">
                        We could not find salary data for this title yet.
                    </p>
                )}
            </div>

            {activeOccupation && selectedWages && (
                <div className="flex flex-col">
                    <div className="flex flex-col items-center justify-center gap-1 text-grayscale-600 pt-2">
                        <div className="flex items-center justify-center gap-1.5 text-[14px] leading-none">
                            <span className="w-[6px] h-[6px] rounded-full bg-grayscale-900 shrink-0" />
                            <span className="text-grayscale-800 font-medium">
                                Median: {formattedMedianSalary}
                            </span>
                        </div>

                        {medianBucketEmploymentCount && (
                            <p className="text-sm font-medium text-grayscale-500">
                                ~ {medianBucketEmploymentCount} people
                            </p>
                        )}
                    </div>

                    <AiPathwayCareerPipeChart
                        wages={activeOccupation.Wages}
                        estimatedEmployment={projection?.EstimatedEmployment}
                        showMedianOverlay={false}
                        salaryType={salaryType}
                    />
                </div>
            )}
        </div>
    );
};

export default AiInsightsAverageSalaryBox;
