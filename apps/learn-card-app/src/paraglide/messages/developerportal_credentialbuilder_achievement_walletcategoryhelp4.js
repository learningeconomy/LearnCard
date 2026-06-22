/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Achievement_Walletcategoryhelp4Inputs */

const en_developerportal_credentialbuilder_achievement_walletcategoryhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategoryhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Where this credential will appear in the recipient's wallet`)
};

const es_developerportal_credentialbuilder_achievement_walletcategoryhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategoryhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Donde aparecerá esta credencial en la cartera del destinatario`)
};

const fr_developerportal_credentialbuilder_achievement_walletcategoryhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategoryhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Où ce crédential apparaîtra dans le portefeuille du destinataire`)
};

const ar_developerportal_credentialbuilder_achievement_walletcategoryhelp4 = /** @type {(inputs: Developerportal_Credentialbuilder_Achievement_Walletcategoryhelp4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أين سيظهر هذا الاعتماد في محفظة المستلم`)
};

/**
* | output |
* | --- |
* | "Where this credential will appear in the recipient's wallet" |
*
* @param {Developerportal_Credentialbuilder_Achievement_Walletcategoryhelp4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_achievement_walletcategoryhelp4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Achievement_Walletcategoryhelp4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Achievement_Walletcategoryhelp4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_achievement_walletcategoryhelp4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_achievement_walletcategoryhelp4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_achievement_walletcategoryhelp4(inputs)
	return ar_developerportal_credentialbuilder_achievement_walletcategoryhelp4(inputs)
});
export { developerportal_credentialbuilder_achievement_walletcategoryhelp4 as "developerPortal.credentialBuilder.achievement.walletCategoryHelp" }