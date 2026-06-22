/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ percent: NonNullable<unknown> }} Skillprofile_Percentoptimized2Inputs */

const en_skillprofile_percentoptimized2 = /** @type {(inputs: Skillprofile_Percentoptimized2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% optimized`)
};

const es_skillprofile_percentoptimized2 = /** @type {(inputs: Skillprofile_Percentoptimized2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% optimizado`)
};

const fr_skillprofile_percentoptimized2 = /** @type {(inputs: Skillprofile_Percentoptimized2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% optimisé`)
};

const ar_skillprofile_percentoptimized2 = /** @type {(inputs: Skillprofile_Percentoptimized2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% مُحسّن`)
};

/**
* | output |
* | --- |
* | "{percent}% optimized" |
*
* @param {Skillprofile_Percentoptimized2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_percentoptimized2 = /** @type {((inputs: Skillprofile_Percentoptimized2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Percentoptimized2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_percentoptimized2(inputs)
	if (locale === "es") return es_skillprofile_percentoptimized2(inputs)
	if (locale === "fr") return fr_skillprofile_percentoptimized2(inputs)
	return ar_skillprofile_percentoptimized2(inputs)
});
export { skillprofile_percentoptimized2 as "skillProfile.percentOptimized" }