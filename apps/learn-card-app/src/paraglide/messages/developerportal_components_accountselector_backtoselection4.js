/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Backtoselection4Inputs */

const en_developerportal_components_accountselector_backtoselection4 = /** @type {(inputs: Developerportal_Components_Accountselector_Backtoselection4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`← Back to selection`)
};

const es_developerportal_components_accountselector_backtoselection4 = /** @type {(inputs: Developerportal_Components_Accountselector_Backtoselection4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`← Volver a selección`)
};

const fr_developerportal_components_accountselector_backtoselection4 = /** @type {(inputs: Developerportal_Components_Accountselector_Backtoselection4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`← Retour à la sélection`)
};

const ar_developerportal_components_accountselector_backtoselection4 = /** @type {(inputs: Developerportal_Components_Accountselector_Backtoselection4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`← العودة إلى الاختيار`)
};

/**
* | output |
* | --- |
* | "← Back to selection" |
*
* @param {Developerportal_Components_Accountselector_Backtoselection4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_backtoselection4 = /** @type {((inputs?: Developerportal_Components_Accountselector_Backtoselection4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Backtoselection4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_backtoselection4(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_backtoselection4(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_backtoselection4(inputs)
	return ar_developerportal_components_accountselector_backtoselection4(inputs)
});
export { developerportal_components_accountselector_backtoselection4 as "developerPortal.components.accountSelector.backToSelection" }