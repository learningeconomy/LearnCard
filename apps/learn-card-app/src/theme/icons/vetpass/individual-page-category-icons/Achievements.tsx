import * as React from 'react';
import type { SVGProps } from 'react';
const SvgAchievements = (props: SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 54 54" {...props}>
        <g clipPath="url(#Achievements_svg__a)">
            <path
                fill="#867357"
                d="M15.923 36c-1.704 0-3.262.966-3.805 2.581a28 28 0 0 0-.838 3.044h-.829c-1.784 0-3.385 1.06-3.863 2.78a40 40 0 0 0-.929 4.281c-.265 1.635 1.038 3.064 2.694 3.064h36.583c1.657 0 2.96-1.429 2.694-3.064a40 40 0 0 0-.929-4.281c-.477-1.72-2.079-2.78-3.862-2.78h-.828a28 28 0 0 0-.838-3.044C40.63 36.966 39.073 36 37.368 36z"
            />
            <path
                fill="#fff"
                stroke="#867357"
                strokeWidth={3}
                d="M24.344 3.702c1.175-2.28 4.416-2.28 5.592 0l2.706 5.25 5.852 1.16c2.399.476 3.368 3.4 1.734 5.23l-4.186 4.685.76 6.197c.307 2.51-2.285 4.354-4.532 3.224l-5.13-2.576-5.13 2.576c-2.248 1.13-4.84-.714-4.532-3.224l.76-6.197-4.186-4.685c-1.634-1.83-.665-4.754 1.734-5.23l5.852-1.16z"
            />
        </g>
        <defs>
            <clipPath id="Achievements_svg__a">
                <path fill="#fff" d="M0 0h54v54H0z" />
            </clipPath>
        </defs>
    </svg>
);
export default SvgAchievements;

