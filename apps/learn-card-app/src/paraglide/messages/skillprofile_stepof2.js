/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ current: NonNullable<unknown>, total: NonNullable<unknown> }} Skillprofile_Stepof2Inputs */

const en_skillprofile_stepof2 = /** @type {(inputs: Skillprofile_Stepof2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.current} of ${i?.total}`)
};

const es_skillprofile_stepof2 = /** @type {(inputs: Skillprofile_Stepof2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.current} de ${i?.total}`)
};

const fr_skillprofile_stepof2 = /** @type {(inputs: Skillprofile_Stepof2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.current} sur ${i?.total}`)
};

const ar_skillprofile_stepof2 = /** @type {(inputs: Skillprofile_Stepof2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.current} من ${i?.total}`)
};

/**
* | output |
* | --- |
* | "{current} of {total}" |
*
* @param {Skillprofile_Stepof2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_stepof2 = /** @type {((inputs: Skillprofile_Stepof2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Stepof2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_stepof2(inputs)
	if (locale === "es") return es_skillprofile_stepof2(inputs)
	if (locale === "fr") return fr_skillprofile_stepof2(inputs)
	return ar_skillprofile_stepof2(inputs)
});
export { skillprofile_stepof2 as "skillProfile.stepOf" }