/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Walletcategory3Inputs */

const en_developerportal_credentialbuilder_achievement_walletcategory3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Wallet Category`)
};

const es_developerportal_credentialbuilder_achievement_walletcategory3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Categoría en Cartera`)
};

const fr_developerportal_credentialbuilder_achievement_walletcategory3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Catégorie dans le Portefeuille`)
};

const ar_developerportal_credentialbuilder_achievement_walletcategory3 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategory3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فئة المحفظة`)
};

/**
* | output |
* | --- |
* | "Wallet Category" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Walletcategory3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_walletcategory3 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Walletcategory3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Walletcategory3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_walletcategory3(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_walletcategory3(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_walletcategory3(inputs)
	return ar_developerportal_credentialbuilder_achievement_walletcategory3(inputs)
});
export { developerportal_credentialbuilder_achievement_walletcategory3 as "developerPortal.credentialBuilder.achievement.walletCategory" }