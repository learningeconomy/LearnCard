/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountswitcher_Switchaccount3Inputs */

const en_developerportal_components_accountswitcher_switchaccount3 = /** @type {(inputs: Developerportal_Components_Accountswitcher_Switchaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Switch Account`)
};

const es_developerportal_components_accountswitcher_switchaccount3 = /** @type {(inputs: Developerportal_Components_Accountswitcher_Switchaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cambiar Cuenta`)
};

const fr_developerportal_components_accountswitcher_switchaccount3 = /** @type {(inputs: Developerportal_Components_Accountswitcher_Switchaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changer de Compte`)
};

const ar_developerportal_components_accountswitcher_switchaccount3 = /** @type {(inputs: Developerportal_Components_Accountswitcher_Switchaccount3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تبديل الحساب`)
};

/**
* | output |
* | --- |
* | "Switch Account" |
*
* @param {Developerportal_Components_Accountswitcher_Switchaccount3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountswitcher_switchaccount3 = /** @type {((inputs?: Developerportal_Components_Accountswitcher_Switchaccount3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountswitcher_Switchaccount3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountswitcher_switchaccount3(inputs)
	if (locale === "es") return es_developerportal_components_accountswitcher_switchaccount3(inputs)
	if (locale === "fr") return fr_developerportal_components_accountswitcher_switchaccount3(inputs)
	return ar_developerportal_components_accountswitcher_switchaccount3(inputs)
});
export { developerportal_components_accountswitcher_switchaccount3 as "developerPortal.components.accountSwitcher.switchAccount" }