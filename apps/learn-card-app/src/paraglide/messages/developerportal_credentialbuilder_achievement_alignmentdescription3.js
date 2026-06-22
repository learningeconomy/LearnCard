/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Alignmentdescription3Inputs */

const en_developerportal_credentialbuilder_achievement_alignmentdescription3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Alignmentdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Link this achievement to standards, frameworks, or competencies`)
};

const es_developerportal_credentialbuilder_achievement_alignmentdescription3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Alignmentdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vincula este logro a estándares, marcos o competencias`)
};

const fr_developerportal_credentialbuilder_achievement_alignmentdescription3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Alignmentdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liez cette réalisation à des normes, cadres ou compétences`)
};

const ar_developerportal_credentialbuilder_achievement_alignmentdescription3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Alignmentdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اربط هذا الإنجاز بالمعايير أو الأطر أو الكفاءات`)
};

/**
* | output |
* | --- |
* | "Link this achievement to standards, frameworks, or competencies" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Alignmentdescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_alignmentdescription3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Alignmentdescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Alignmentdescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_alignmentdescription3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_alignmentdescription3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_alignmentdescription3(inputs)
	return ar_developerportal_credentialbuilder_achievement_alignmentdescription3(inputs)
});
export { developerportal_credentialbuilder_achievement_alignmentdescription3 as "developerPortal.credentialBuilder.achievement.alignmentDescription" }