import * as React from 'react';
import type { SVGProps } from 'react';
const SvgCompassPathways = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 55 55" {...props}>
        <path
            fill="#706049"
            stroke="#5A4D3B"
            strokeMiterlimit={10}
            strokeWidth={3}
            d="M27.5 7.5c11.046 0 20 8.954 20 20s-8.954 20-20 20-20-8.954-20-20 8.954-20 20-20Z"
        />
        <path
            fill="#F7F4EE"
            stroke="#F7F4EE"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M31.615 31.366 39 17.5l-16.308 6.292L16 37.045z"
        />
        <path
            fill="#9C8664"
            d="m26.517 24.667.735-1.982a.27.27 0 0 1 .248-.185.27.27 0 0 1 .248.185l.735 1.982c.293.79.857 1.416 1.567 1.74l1.784.817A.3.3 0 0 1 32 27.5a.3.3 0 0 1-.166.276l-1.784.816c-.71.325-1.274.952-1.567 1.74l-.735 1.983a.27.27 0 0 1-.248.185.27.27 0 0 1-.248-.185l-.735-1.982c-.293-.79-.857-1.416-1.567-1.74l-1.784-.817A.3.3 0 0 1 23 27.5a.3.3 0 0 1 .166-.276l1.784-.816c.71-.325 1.274-.952 1.567-1.74"
        />
    </svg>
);
export default SvgCompassPathways;

