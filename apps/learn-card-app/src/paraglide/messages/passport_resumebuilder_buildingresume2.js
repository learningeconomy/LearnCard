/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Buildingresume2Inputs */

const en_passport_resumebuilder_buildingresume2 = /** @type {(inputs: Passport_Resumebuilder_Buildingresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Building your resume...`)
};

const es_passport_resumebuilder_buildingresume2 = /** @type {(inputs: Passport_Resumebuilder_Buildingresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creando tu currículum...`)
};

const fr_passport_resumebuilder_buildingresume2 = /** @type {(inputs: Passport_Resumebuilder_Buildingresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Création de votre CV...`)
};

const ar_passport_resumebuilder_buildingresume2 = /** @type {(inputs: Passport_Resumebuilder_Buildingresume2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ إنشاء سيرتك الذاتية...`)
};

/**
* | output |
* | --- |
* | "Building your resume..." |
*
* @param {Passport_Resumebuilder_Buildingresume2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_buildingresume2 = /** @type {((inputs?: Passport_Resumebuilder_Buildingresume2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Buildingresume2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_buildingresume2(inputs)
	if (locale === "es") return es_passport_resumebuilder_buildingresume2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_buildingresume2(inputs)
	return ar_passport_resumebuilder_buildingresume2(inputs)
});
export { passport_resumebuilder_buildingresume2 as "passport.resumeBuilder.buildingResume" }