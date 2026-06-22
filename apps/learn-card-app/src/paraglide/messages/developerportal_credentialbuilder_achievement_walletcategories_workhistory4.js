/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Walletcategories_Workhistory4Inputs */

const en_developerportal_credentialbuilder_achievement_walletcategories_workhistory4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Workhistory4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work History`)
};

const es_developerportal_credentialbuilder_achievement_walletcategories_workhistory4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Workhistory4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work History`)
};

const fr_developerportal_credentialbuilder_achievement_walletcategories_workhistory4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Workhistory4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work History`)
};

const ar_developerportal_credentialbuilder_achievement_walletcategories_workhistory4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategories_Workhistory4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Work History`)
};

/**
* | output |
* | --- |
* | "Work History" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Walletcategories_Workhistory4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_walletcategories_workhistory4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Walletcategories_Workhistory4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Walletcategories_Workhistory4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_walletcategories_workhistory4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_walletcategories_workhistory4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_walletcategories_workhistory4(inputs)
	return ar_developerportal_credentialbuilder_achievement_walletcategories_workhistory4(inputs)
});
export { developerportal_credentialbuilder_achievement_walletcategories_workhistory4 as "developerPortal.credentialBuilder.achievement.walletCategories.workHistory" }