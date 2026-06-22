/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Uploadlogo3Inputs */

const en_developerportal_components_accountselector_uploadlogo3 = /** @type {(inputs: Developerportal_Components_Accountselector_Uploadlogo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Upload Logo`)
};

const es_developerportal_components_accountselector_uploadlogo3 = /** @type {(inputs: Developerportal_Components_Accountselector_Uploadlogo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Subir Logotipo`)
};

const fr_developerportal_components_accountselector_uploadlogo3 = /** @type {(inputs: Developerportal_Components_Accountselector_Uploadlogo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Télécharger le Logo`)
};

const ar_developerportal_components_accountselector_uploadlogo3 = /** @type {(inputs: Developerportal_Components_Accountselector_Uploadlogo3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`رفع الشعار`)
};

/**
* | output |
* | --- |
* | "Upload Logo" |
*
* @param {Developerportal_Components_Accountselector_Uploadlogo3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_uploadlogo3 = /** @type {((inputs?: Developerportal_Components_Accountselector_Uploadlogo3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Uploadlogo3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_uploadlogo3(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_uploadlogo3(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_uploadlogo3(inputs)
	return ar_developerportal_components_accountselector_uploadlogo3(inputs)
});
export { developerportal_components_accountselector_uploadlogo3 as "developerPortal.components.accountSelector.uploadLogo" }