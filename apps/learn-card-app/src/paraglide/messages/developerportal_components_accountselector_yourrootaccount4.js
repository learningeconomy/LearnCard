/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Yourrootaccount4Inputs */

const en_developerportal_components_accountselector_yourrootaccount4 = /** @type {(inputs: Developerportal_Components_Accountselector_Yourrootaccount4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your root account`)
};

const es_developerportal_components_accountselector_yourrootaccount4 = /** @type {(inputs: Developerportal_Components_Accountselector_Yourrootaccount4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu cuenta principal`)
};

const fr_developerportal_components_accountselector_yourrootaccount4 = /** @type {(inputs: Developerportal_Components_Accountselector_Yourrootaccount4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre compte racine`)
};

const ar_developerportal_components_accountselector_yourrootaccount4 = /** @type {(inputs: Developerportal_Components_Accountselector_Yourrootaccount4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حسابك الرئيسي`)
};

/**
* | output |
* | --- |
* | "Your root account" |
*
* @param {Developerportal_Components_Accountselector_Yourrootaccount4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_yourrootaccount4 = /** @type {((inputs?: Developerportal_Components_Accountselector_Yourrootaccount4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Yourrootaccount4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_yourrootaccount4(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_yourrootaccount4(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_yourrootaccount4(inputs)
	return ar_developerportal_components_accountselector_yourrootaccount4(inputs)
});
export { developerportal_components_accountselector_yourrootaccount4 as "developerPortal.components.accountSelector.yourRootAccount" }