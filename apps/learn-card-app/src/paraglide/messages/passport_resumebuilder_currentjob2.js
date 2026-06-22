/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Currentjob2Inputs */

const en_passport_resumebuilder_currentjob2 = /** @type {(inputs: Passport_Resumebuilder_Currentjob2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Current Job`)
};

const es_passport_resumebuilder_currentjob2 = /** @type {(inputs: Passport_Resumebuilder_Currentjob2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Empleo actual`)
};

const fr_passport_resumebuilder_currentjob2 = /** @type {(inputs: Passport_Resumebuilder_Currentjob2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emploi actuel`)
};

const ar_passport_resumebuilder_currentjob2 = /** @type {(inputs: Passport_Resumebuilder_Currentjob2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الوظيفة الحالية`)
};

/**
* | output |
* | --- |
* | "Current Job" |
*
* @param {Passport_Resumebuilder_Currentjob2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_currentjob2 = /** @type {((inputs?: Passport_Resumebuilder_Currentjob2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Currentjob2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_currentjob2(inputs)
	if (locale === "es") return es_passport_resumebuilder_currentjob2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_currentjob2(inputs)
	return ar_passport_resumebuilder_currentjob2(inputs)
});
export { passport_resumebuilder_currentjob2 as "passport.resumeBuilder.currentJob" }