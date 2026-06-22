/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ percent: NonNullable<unknown> }} Passport_Buildmylearncard_Progress3Inputs */

const en_passport_buildmylearncard_progress3 = /** @type {(inputs: Passport_Buildmylearncard_Progress3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% optimized`)
};

const es_passport_buildmylearncard_progress3 = /** @type {(inputs: Passport_Buildmylearncard_Progress3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% optimizado`)
};

const fr_passport_buildmylearncard_progress3 = /** @type {(inputs: Passport_Buildmylearncard_Progress3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% optimisé`)
};

const ar_passport_buildmylearncard_progress3 = /** @type {(inputs: Passport_Buildmylearncard_Progress3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.percent}% محسّن`)
};

/**
* | output |
* | --- |
* | "{percent}% optimized" |
*
* @param {Passport_Buildmylearncard_Progress3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_buildmylearncard_progress3 = /** @type {((inputs: Passport_Buildmylearncard_Progress3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Buildmylearncard_Progress3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_buildmylearncard_progress3(inputs)
	if (locale === "es") return es_passport_buildmylearncard_progress3(inputs)
	if (locale === "fr") return fr_passport_buildmylearncard_progress3(inputs)
	return ar_passport_buildmylearncard_progress3(inputs)
});
export { passport_buildmylearncard_progress3 as "passport.buildMyLearnCard.progress" }