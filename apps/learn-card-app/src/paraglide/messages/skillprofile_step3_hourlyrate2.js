/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step3_Hourlyrate2Inputs */

const en_skillprofile_step3_hourlyrate2 = /** @type {(inputs: Skillprofile_Step3_Hourlyrate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Per Hour`)
};

const es_skillprofile_step3_hourlyrate2 = /** @type {(inputs: Skillprofile_Step3_Hourlyrate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por hora`)
};

const fr_skillprofile_step3_hourlyrate2 = /** @type {(inputs: Skillprofile_Step3_Hourlyrate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Par heure`)
};

const ar_skillprofile_step3_hourlyrate2 = /** @type {(inputs: Skillprofile_Step3_Hourlyrate2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`بالساعة`)
};

/**
* | output |
* | --- |
* | "Per Hour" |
*
* @param {Skillprofile_Step3_Hourlyrate2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step3_hourlyrate2 = /** @type {((inputs?: Skillprofile_Step3_Hourlyrate2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step3_Hourlyrate2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step3_hourlyrate2(inputs)
	if (locale === "es") return es_skillprofile_step3_hourlyrate2(inputs)
	if (locale === "fr") return fr_skillprofile_step3_hourlyrate2(inputs)
	return ar_skillprofile_step3_hourlyrate2(inputs)
});
export { skillprofile_step3_hourlyrate2 as "skillProfile.step3.hourlyRate" }