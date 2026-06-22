/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Walletcategories_Membership3Inputs */

const en_developerportal_credentialbuilder_achievement_walletcategories_membership3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Membership3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membership`)
};

const es_developerportal_credentialbuilder_achievement_walletcategories_membership3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Membership3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membership`)
};

const fr_developerportal_credentialbuilder_achievement_walletcategories_membership3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Membership3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membership`)
};

const ar_developerportal_credentialbuilder_achievement_walletcategories_membership3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Membership3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Membership`)
};

/**
* | output |
* | --- |
* | "Membership" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Walletcategories_Membership3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_walletcategories_membership3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Walletcategories_Membership3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Walletcategories_Membership3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_walletcategories_membership3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_walletcategories_membership3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_walletcategories_membership3(inputs)
	return ar_developerportal_credentialbuilder_achievement_walletcategories_membership3(inputs)
});
export { developerportal_credentialbuilder_achievement_walletcategories_membership3 as "developerPortal.credentialBuilder.achievement.walletCategories.membership" }