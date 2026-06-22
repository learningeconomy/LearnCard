/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Personalinfo_Title2Inputs */

const en_passport_resumebuilder_personalinfo_title2 = /** @type {(inputs: Passport_Resumebuilder_Personalinfo_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personal Info`)
};

const es_passport_resumebuilder_personalinfo_title2 = /** @type {(inputs: Passport_Resumebuilder_Personalinfo_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Información personal`)
};

const fr_passport_resumebuilder_personalinfo_title2 = /** @type {(inputs: Passport_Resumebuilder_Personalinfo_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Informations personnelles`)
};

const ar_passport_resumebuilder_personalinfo_title2 = /** @type {(inputs: Passport_Resumebuilder_Personalinfo_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المعلومات الشخصية`)
};

/**
* | output |
* | --- |
* | "Personal Info" |
*
* @param {Passport_Resumebuilder_Personalinfo_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_personalinfo_title2 = /** @type {((inputs?: Passport_Resumebuilder_Personalinfo_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Personalinfo_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_personalinfo_title2(inputs)
	if (locale === "es") return es_passport_resumebuilder_personalinfo_title2(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_personalinfo_title2(inputs)
	return ar_passport_resumebuilder_personalinfo_title2(inputs)
});
export { passport_resumebuilder_personalinfo_title2 as "passport.resumeBuilder.personalInfo.title" }