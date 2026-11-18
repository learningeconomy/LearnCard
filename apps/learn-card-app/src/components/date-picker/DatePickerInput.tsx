import React, { Suspense } from 'react';
import { lazyWithRetry } from 'learn-card-base/helpers/lazyWithRetry';

import type { DatePickerInputProps } from './DatePickerInputContent';

// react-datepicker and the date-fns locales (~210 KB) load the first time a date field renders, instead
// of riding along with every screen that can open a form.
const LazyDatePickerInput = lazyWithRetry(() => import('./DatePickerInputContent'));

const DatePickerInput: React.FC<DatePickerInputProps> = props => (
    <Suspense fallback={<div className="w-full h-[56px] bg-grayscale-100 rounded-[15px]" />}>
        <LazyDatePickerInput {...props} />
    </Suspense>
);

export default DatePickerInput;
