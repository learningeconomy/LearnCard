/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Personalaccount3Inputs */

const en_developerportal_components_accountselector_personalaccount3 = /** @type {(inputs: Developerportal_Components_Accountselector_Personalaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personal Account`)
};

const es_developerportal_components_accountselector_personalaccount3 = /** @type {(inputs: Developerportal_Components_Accountselector_Personalaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuenta Personal`)
};

const fr_developerportal_components_accountselector_personalaccount3 = /** @type {(inputs: Developerportal_Components_Accountselector_Personalaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compte Personnel`)
};

const ar_developerportal_components_accountselector_personalaccount3 = /** @type {(inputs: Developerportal_Components_Accountselector_Personalaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حساب شخصي`)
};

/**
* | output |
* | --- |
* | "Personal Account" |
*
* @param {Developerportal_Components_Accountselector_Personalaccount3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_personalaccount3 = /** @type {((inputs?: Developerportal_Components_Accountselector_Personalaccount3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Personalaccount3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_personalaccount3(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_personalaccount3(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_personalaccount3(inputs)
	return ar_developerportal_components_accountselector_personalaccount3(inputs)
});
export { developerportal_components_accountselector_personalaccount3 as "developerPortal.components.accountSelector.personalAccount" }