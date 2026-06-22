/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Selectaccount3Inputs */

const en_developerportal_components_accountselector_selectaccount3 = /** @type {(inputs: Developerportal_Components_Accountselector_Selectaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Select Account`)
};

const es_developerportal_components_accountselector_selectaccount3 = /** @type {(inputs: Developerportal_Components_Accountselector_Selectaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seleccionar Cuenta`)
};

const fr_developerportal_components_accountselector_selectaccount3 = /** @type {(inputs: Developerportal_Components_Accountselector_Selectaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sélectionner un Compte`)
};

const ar_developerportal_components_accountselector_selectaccount3 = /** @type {(inputs: Developerportal_Components_Accountselector_Selectaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اختيار حساب`)
};

/**
* | output |
* | --- |
* | "Select Account" |
*
* @param {Developerportal_Components_Accountselector_Selectaccount3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_selectaccount3 = /** @type {((inputs?: Developerportal_Components_Accountselector_Selectaccount3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Selectaccount3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_selectaccount3(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_selectaccount3(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_selectaccount3(inputs)
	return ar_developerportal_components_accountselector_selectaccount3(inputs)
});
export { developerportal_components_accountselector_selectaccount3 as "developerPortal.components.accountSelector.selectAccount" }