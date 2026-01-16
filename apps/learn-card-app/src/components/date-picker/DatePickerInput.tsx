import React from 'react';
import moment from 'moment';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Calendar } from 'lucide-react';
import { IonDatetime } from '@ionic/react';
import { useModal, ModalTypes } from 'learn-card-base';

interface DatePickerInputProps {
    value: string;
    onChange: (date: string) => void;
    error?: string;
    isMobile: boolean;
    label?: string;
    minDate?: string;
    maxDate?: string;
}

const DatePickerInput: React.FC<DatePickerInputProps> = ({
    value,
    onChange,
    error,
    isMobile,
    label = 'Date of Birth',
    minDate = new Date('1900-01-01T00:00:00'),
    maxDate = new Date(),
}) => {
    const { newModal, closeModal } = useModal();

    const handleDateChange = (date: Date | null) => {
        if (!date) {
            onChange('');
        } else {
            onChange(moment(date).format('YYYY-MM-DD'));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        if (!inputValue) {
            onChange('');
            return;
        }

        const formats = [
            'MMMM D, YYYY',
            'MM/DD/YYYY',
            'M/D/YYYY',
            'MM-DD-YYYY',
            'M-D-YYYY',
            'MMMM D YYYY',
        ];

        const parsed = moment(inputValue, formats, true);

        if (parsed.isValid()) {
            if (parsed.year() < 1900) {
                return 'Year must be 1900 or later';
            }
            if (maxDate && parsed.isAfter(moment(maxDate), 'day')) {
                return `Date cannot be after ${moment(maxDate).format('MMMM D, YYYY')}`;
            }
            onChange(parsed.format('YYYY-MM-DD'));
        }
    };

    if (isMobile) {
        return (
            <>
                <button
                    type="button"
                    className={`w-full flex items-center justify-between bg-grayscale-100 text-grayscale-500 rounded-[15px] font-poppins font-normal px-[16px] py-[16px] tracking-wider text-base ${
                        error ? 'login-input-email-error' : ''
                    }`}
                    onClick={e => {
                        e.preventDefault();
                        newModal(
                            <div className="w-full h-full transparent flex items-center justify-center">
                                <IonDatetime
                                    onIonChange={e => {
                                        if (e.detail.value) {
                                            onChange(moment(e.detail.value).format('YYYY-MM-DD'));
                                            closeModal();
                                        }
                                    }}
                                    value={value || undefined}
                                    presentation="date"
                                    className="bg-white text-black rounded-[20px] w-full shadow-3xl z-50 font-notoSans"
                                    showDefaultButtons
                                    color="indigo-500"
                                    max={maxDate || moment().format('YYYY-MM-DD')}
                                    min={minDate}
                                    onIonCancel={closeModal}
                                />
                            </div>,
                            {
                                disableCloseHandlers: true,
                                sectionClassName:
                                    '!bg-transparent !border-none !shadow-none !rounded-none',
                            },
                            {
                                desktop: ModalTypes.Center,
                                mobile: ModalTypes.Center,
                            }
                        );
                    }}
                >
                    {value ? moment(value).format('MMMM D, YYYY') : label}
                    <Calendar className="pointer-events-none text-grayscale-700 w-[24px]" />
                </button>
            </>
        );
    }

    return (
        <div className="relative w-full z-10">
            <DatePicker
                selected={value ? moment(value, 'YYYY-MM-DD').toDate() : null}
                onChange={handleDateChange}
                onBlur={handleBlur}
                placeholderText={label}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                maxDate={maxDate ? new Date(maxDate) : new Date()}
                minDate={new Date(minDate)}
                wrapperClassName="w-full"
                popperClassName="z-[9999]"
                dateFormat="MMMM d, yyyy"
                className={`w-full flex items-center justify-between bg-grayscale-100 text-grayscale-500 rounded-[15px] font-poppins font-normal px-[16px] py-[16px] tracking-wider text-base ${
                    error ? 'login-input-email-error' : ''
                }`}
            />
            <Calendar className="pointer-events-none absolute right-[16px] top-[50%] -translate-y-1/2 text-grayscale-700 w-[24px]" />
        </div>
    );
};

export default DatePickerInput;
