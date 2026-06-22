/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Organizationnameplaceholder4Inputs */

const en_developerportal_components_accountselector_organizationnameplaceholder4 = /** @type {(inputs: Developerportal_Components_Accountselector_Organizationnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g., Ascend Learning`)
};

const es_developerportal_components_accountselector_organizationnameplaceholder4 = /** @type {(inputs: Developerportal_Components_Accountselector_Organizationnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ej., Ascend Learning`)
};

const fr_developerportal_components_accountselector_organizationnameplaceholder4 = /** @type {(inputs: Developerportal_Components_Accountselector_Organizationnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ex., Ascend Learning`)
};

const ar_developerportal_components_accountselector_organizationnameplaceholder4 = /** @type {(inputs: Developerportal_Components_Accountselector_Organizationnameplaceholder4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: Ascend Learning`)
};

/**
* | output |
* | --- |
* | "e.g., Ascend Learning" |
*
* @param {Developerportal_Components_Accountselector_Organizationnameplaceholder4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_organizationnameplaceholder4 = /** @type {((inputs?: Developerportal_Components_Accountselector_Organizationnameplaceholder4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Organizationnameplaceholder4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_organizationnameplaceholder4(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_organizationnameplaceholder4(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_organizationnameplaceholder4(inputs)
	return ar_developerportal_components_accountselector_organizationnameplaceholder4(inputs)
});
export { developerportal_components_accountselector_organizationnameplaceholder4 as "developerPortal.components.accountSelector.organizationNamePlaceholder" }