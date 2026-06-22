/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ age: NonNullable<unknown> }} Developerportal_Components_Appdetailsstep_Softblockdesc5Inputs */

const en_developerportal_components_appdetailsstep_softblockdesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Softblockdesc5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Soft block: Child profiles under ${i?.age} will need guardian approval to install.`)
};

const es_developerportal_components_appdetailsstep_softblockdesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Softblockdesc5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Soft block: Child profiles under ${i?.age} will need guardian approval to install.`)
};

const fr_developerportal_components_appdetailsstep_softblockdesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Softblockdesc5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Soft block: Child profiles under ${i?.age} will need guardian approval to install.`)
};

const ar_developerportal_components_appdetailsstep_softblockdesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Softblockdesc5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Soft block: Child profiles under ${i?.age} will need guardian approval to install.`)
};

/**
* | output |
* | --- |
* | "Soft block: Child profiles under {age} will need guardian approval to install." |
*
* @param {Developerportal_Components_Appdetailsstep_Softblockdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_softblockdesc5 = /** @type {((inputs: Developerportal_Components_Appdetailsstep_Softblockdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Softblockdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_softblockdesc5(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_softblockdesc5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_softblockdesc5(inputs)
	return ar_developerportal_components_appdetailsstep_softblockdesc5(inputs)
});
export { developerportal_components_appdetailsstep_softblockdesc5 as "developerPortal.components.appDetailsStep.softBlockDesc" }