/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ n: NonNullable<unknown> }} Developerportal_Credentialbuilder_Achievement_Alignmentnumber3Inputs */

const en_developerportal_credentialbuilder_achievement_alignmentnumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Alignmentnumber3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Alignment ${i?.n}`)
};

const es_developerportal_credentialbuilder_achievement_alignmentnumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Alignmentnumber3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Alineación ${i?.n}`)
};

const fr_developerportal_credentialbuilder_achievement_alignmentnumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Alignmentnumber3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Alignement ${i?.n}`)
};

const ar_developerportal_credentialbuilder_achievement_alignmentnumber3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Alignmentnumber3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`محاذاة ${i?.n}`)
};

/**
* | output |
* | --- |
* | "Alignment {n}" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Alignmentnumber3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_alignmentnumber3 = /** @type {((inputs: Developerportal_Credentialbuilder_Achievement_Alignmentnumber3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Alignmentnumber3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_alignmentnumber3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_alignmentnumber3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_alignmentnumber3(inputs)
	return ar_developerportal_credentialbuilder_achievement_alignmentnumber3(inputs)
});
export { developerportal_credentialbuilder_achievement_alignmentnumber3 as "developerPortal.credentialBuilder.achievement.alignmentNumber" }