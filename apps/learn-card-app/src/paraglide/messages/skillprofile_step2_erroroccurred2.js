/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Skillprofile_Step2_Erroroccurred2Inputs */

const en_skillprofile_step2_erroroccurred2 = /** @type {(inputs: Skillprofile_Step2_Erroroccurred2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error occurred`)
};

const es_skillprofile_step2_erroroccurred2 = /** @type {(inputs: Skillprofile_Step2_Erroroccurred2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error`)
};

const fr_skillprofile_step2_erroroccurred2 = /** @type {(inputs: Skillprofile_Step2_Erroroccurred2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur s'est produite`)
};

const ar_skillprofile_step2_erroroccurred2 = /** @type {(inputs: Skillprofile_Step2_Erroroccurred2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ`)
};

/**
* | output |
* | --- |
* | "An error occurred" |
*
* @param {Skillprofile_Step2_Erroroccurred2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const skillprofile_step2_erroroccurred2 = /** @type {((inputs?: Skillprofile_Step2_Erroroccurred2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Skillprofile_Step2_Erroroccurred2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_skillprofile_step2_erroroccurred2(inputs)
	if (locale === "es") return es_skillprofile_step2_erroroccurred2(inputs)
	if (locale === "fr") return fr_skillprofile_step2_erroroccurred2(inputs)
	return ar_skillprofile_step2_erroroccurred2(inputs)
});
export { skillprofile_step2_erroroccurred2 as "skillProfile.step2.errorOccurred" }