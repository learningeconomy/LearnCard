/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step3_Peryear2Inputs */

const en_skillprofile_step3_peryear2 = /** @type {(inputs: Skillprofile_Step3_Peryear2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Per Year`)
};

const es_skillprofile_step3_peryear2 = /** @type {(inputs: Skillprofile_Step3_Peryear2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Por año`)
};

const fr_skillprofile_step3_peryear2 = /** @type {(inputs: Skillprofile_Step3_Peryear2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Par an`)
};

const ar_skillprofile_step3_peryear2 = /** @type {(inputs: Skillprofile_Step3_Peryear2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سنوياً`)
};

/**
* | output |
* | --- |
* | "Per Year" |
*
* @param {Skillprofile_Step3_Peryear2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step3_peryear2 = /** @type {((inputs?: Skillprofile_Step3_Peryear2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step3_Peryear2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step3_peryear2(inputs)
	if (locale === "es") return es_skillprofile_step3_peryear2(inputs)
	if (locale === "fr") return fr_skillprofile_step3_peryear2(inputs)
	return ar_skillprofile_step3_peryear2(inputs)
});
export { skillprofile_step3_peryear2 as "skillProfile.step3.perYear" }