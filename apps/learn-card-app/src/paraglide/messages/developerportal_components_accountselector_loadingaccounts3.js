/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Loadingaccounts3Inputs */

const en_developerportal_components_accountselector_loadingaccounts3 = /** @type {(inputs: Developerportal_Components_Accountselector_Loadingaccounts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading accounts...`)
};

const es_developerportal_components_accountselector_loadingaccounts3 = /** @type {(inputs: Developerportal_Components_Accountselector_Loadingaccounts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando cuentas...`)
};

const fr_developerportal_components_accountselector_loadingaccounts3 = /** @type {(inputs: Developerportal_Components_Accountselector_Loadingaccounts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des comptes...`)
};

const ar_developerportal_components_accountselector_loadingaccounts3 = /** @type {(inputs: Developerportal_Components_Accountselector_Loadingaccounts3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل الحسابات...`)
};

/**
* | output |
* | --- |
* | "Loading accounts..." |
*
* @param {Developerportal_Components_Accountselector_Loadingaccounts3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_loadingaccounts3 = /** @type {((inputs?: Developerportal_Components_Accountselector_Loadingaccounts3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Loadingaccounts3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_loadingaccounts3(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_loadingaccounts3(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_loadingaccounts3(inputs)
	return ar_developerportal_components_accountselector_loadingaccounts3(inputs)
});
export { developerportal_components_accountselector_loadingaccounts3 as "developerPortal.components.accountSelector.loadingAccounts" }