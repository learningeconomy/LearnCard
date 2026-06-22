/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Present1Inputs */

const en_skillprofile_step2_present1 = /** @type {(inputs: Skillprofile_Step2_Present1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Present`)
};

const es_skillprofile_step2_present1 = /** @type {(inputs: Skillprofile_Step2_Present1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Presente`)
};

const fr_skillprofile_step2_present1 = /** @type {(inputs: Skillprofile_Step2_Present1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Présent`)
};

const ar_skillprofile_step2_present1 = /** @type {(inputs: Skillprofile_Step2_Present1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حتّى الآن`)
};

/**
* | output |
* | --- |
* | "Present" |
*
* @param {Skillprofile_Step2_Present1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_present1 = /** @type {((inputs?: Skillprofile_Step2_Present1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Present1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_present1(inputs)
	if (locale === "es") return es_skillprofile_step2_present1(inputs)
	if (locale === "fr") return fr_skillprofile_step2_present1(inputs)
	return ar_skillprofile_step2_present1(inputs)
});
export { skillprofile_step2_present1 as "skillProfile.step2.present" }