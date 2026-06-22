/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Walletcategories_Accommodation3Inputs */

const en_developerportal_credentialbuilder_achievement_walletcategories_accommodation3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Accommodation3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accommodation`)
};

const es_developerportal_credentialbuilder_achievement_walletcategories_accommodation3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Accommodation3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accommodation`)
};

const fr_developerportal_credentialbuilder_achievement_walletcategories_accommodation3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Accommodation3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accommodation`)
};

const ar_developerportal_credentialbuilder_achievement_walletcategories_accommodation3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Accommodation3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Accommodation`)
};

/**
* | output |
* | --- |
* | "Accommodation" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Walletcategories_Accommodation3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_walletcategories_accommodation3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Walletcategories_Accommodation3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Walletcategories_Accommodation3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_walletcategories_accommodation3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_walletcategories_accommodation3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_walletcategories_accommodation3(inputs)
	return ar_developerportal_credentialbuilder_achievement_walletcategories_accommodation3(inputs)
});
export { developerportal_credentialbuilder_achievement_walletcategories_accommodation3 as "developerPortal.credentialBuilder.achievement.walletCategories.accommodation" }