/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step5_Finish1Inputs */

const en_skillprofile_step5_finish1 = /** @type {(inputs: Skillprofile_Step5_Finish1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Finish`)
};

const es_skillprofile_step5_finish1 = /** @type {(inputs: Skillprofile_Step5_Finish1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Finalizar`)
};

const fr_skillprofile_step5_finish1 = /** @type {(inputs: Skillprofile_Step5_Finish1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Terminer`)
};

const ar_skillprofile_step5_finish1 = /** @type {(inputs: Skillprofile_Step5_Finish1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنهاء`)
};

/**
* | output |
* | --- |
* | "Finish" |
*
* @param {Skillprofile_Step5_Finish1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step5_finish1 = /** @type {((inputs?: Skillprofile_Step5_Finish1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step5_Finish1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step5_finish1(inputs)
	if (locale === "es") return es_skillprofile_step5_finish1(inputs)
	if (locale === "fr") return fr_skillprofile_step5_finish1(inputs)
	return ar_skillprofile_step5_finish1(inputs)
});
export { skillprofile_step5_finish1 as "skillProfile.step5.finish" }