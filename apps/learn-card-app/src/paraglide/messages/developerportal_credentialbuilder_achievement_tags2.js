/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Tags2Inputs */

const en_developerportal_credentialbuilder_achievement_tags2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Tags2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tags`)
};

const es_developerportal_credentialbuilder_achievement_tags2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Tags2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Etiquetas`)
};

const fr_developerportal_credentialbuilder_achievement_tags2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Tags2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Étiquettes`)
};

const ar_developerportal_credentialbuilder_achievement_tags2 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Tags2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`العلامات`)
};

/**
* | output |
* | --- |
* | "Tags" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Tags2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_tags2 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Tags2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Tags2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_tags2(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_tags2(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_tags2(inputs)
	return ar_developerportal_credentialbuilder_achievement_tags2(inputs)
});
export { developerportal_credentialbuilder_achievement_tags2 as "developerPortal.credentialBuilder.achievement.tags" }