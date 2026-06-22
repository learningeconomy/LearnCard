/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Walletcategories_Socialbadge4Inputs */

const en_developerportal_credentialbuilder_achievement_walletcategories_socialbadge4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Socialbadge4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Social Badge`)
};

const es_developerportal_credentialbuilder_achievement_walletcategories_socialbadge4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Socialbadge4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Social Badge`)
};

const fr_developerportal_credentialbuilder_achievement_walletcategories_socialbadge4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Socialbadge4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Social Badge`)
};

const ar_developerportal_credentialbuilder_achievement_walletcategories_socialbadge4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Socialbadge4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Social Badge`)
};

/**
* | output |
* | --- |
* | "Social Badge" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Walletcategories_Socialbadge4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_walletcategories_socialbadge4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Walletcategories_Socialbadge4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Walletcategories_Socialbadge4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_walletcategories_socialbadge4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_walletcategories_socialbadge4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_walletcategories_socialbadge4(inputs)
	return ar_developerportal_credentialbuilder_achievement_walletcategories_socialbadge4(inputs)
});
export { developerportal_credentialbuilder_achievement_walletcategories_socialbadge4 as "developerPortal.credentialBuilder.achievement.walletCategories.socialBadge" }