/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Components_Accountselector_Personal2Inputs */

const en_developerportal_components_accountselector_personal2 = /** @type {(inputs: Developerportal_Components_Accountselector_Personal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personal`)
};

const es_developerportal_components_accountselector_personal2 = /** @type {(inputs: Developerportal_Components_Accountselector_Personal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personal`)
};

const fr_developerportal_components_accountselector_personal2 = /** @type {(inputs: Developerportal_Components_Accountselector_Personal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Personnel`)
};

const ar_developerportal_components_accountselector_personal2 = /** @type {(inputs: Developerportal_Components_Accountselector_Personal2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شخصي`)
};

/**
* | output |
* | --- |
* | "Personal" |
*
* @param {Developerportal_Components_Accountselector_Personal2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_accountselector_personal2 = /** @type {((inputs?: Developerportal_Components_Accountselector_Personal2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Accountselector_Personal2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_accountselector_personal2(inputs)
	if (locale === "es") return es_developerportal_components_accountselector_personal2(inputs)
	if (locale === "fr") return fr_developerportal_components_accountselector_personal2(inputs)
	return ar_developerportal_components_accountselector_personal2(inputs)
});
export { developerportal_components_accountselector_personal2 as "developerPortal.components.accountSelector.personal" }