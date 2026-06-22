/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Currentaccount3Inputs */

const en_developerportal_components_accountselector_currentaccount3 = /** @type {(inputs: Developerportal_Components_Accountselector_Currentaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Current Account`)
};

const es_developerportal_components_accountselector_currentaccount3 = /** @type {(inputs: Developerportal_Components_Accountselector_Currentaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuenta Actual`)
};

const fr_developerportal_components_accountselector_currentaccount3 = /** @type {(inputs: Developerportal_Components_Accountselector_Currentaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compte Actuel`)
};

const ar_developerportal_components_accountselector_currentaccount3 = /** @type {(inputs: Developerportal_Components_Accountselector_Currentaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحساب الحالي`)
};

/**
* | output |
* | --- |
* | "Current Account" |
*
* @param {Developerportal_Components_Accountselector_Currentaccount3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_currentaccount3 = /** @type {((inputs?: Developerportal_Components_Accountselector_Currentaccount3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Currentaccount3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_currentaccount3(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_currentaccount3(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_currentaccount3(inputs)
	return ar_developerportal_components_accountselector_currentaccount3(inputs)
});
export { developerportal_components_accountselector_currentaccount3 as "developerPortal.components.accountSelector.currentAccount" }