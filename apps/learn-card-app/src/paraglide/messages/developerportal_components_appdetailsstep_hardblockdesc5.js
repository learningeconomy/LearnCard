/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ age: NonNullable<unknown> }} Developerportal_Components_Appdetailsstep_Hardblockdesc5Inputs */

const en_developerportal_components_appdetailsstep_hardblockdesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Hardblockdesc5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Hard block: Users under ${i?.age} will not see this app at all.`)
};

const es_developerportal_components_appdetailsstep_hardblockdesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Hardblockdesc5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Hard block: Users under ${i?.age} will not see this app at all.`)
};

const fr_developerportal_components_appdetailsstep_hardblockdesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Hardblockdesc5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Hard block: Users under ${i?.age} will not see this app at all.`)
};

const ar_developerportal_components_appdetailsstep_hardblockdesc5 = /** @type {(inputs: Developerportal_Components_Appdetailsstep_Hardblockdesc5Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Hard block: Users under ${i?.age} will not see this app at all.`)
};

/**
* | output |
* | --- |
* | "Hard block: Users under {age} will not see this app at all." |
*
* @param {Developerportal_Components_Appdetailsstep_Hardblockdesc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_components_appdetailsstep_hardblockdesc5 = /** @type {((inputs: Developerportal_Components_Appdetailsstep_Hardblockdesc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Components_Appdetailsstep_Hardblockdesc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_components_appdetailsstep_hardblockdesc5(inputs)
	if (locale === "es") return es_developerportal_components_appdetailsstep_hardblockdesc5(inputs)
	if (locale === "fr") return fr_developerportal_components_appdetailsstep_hardblockdesc5(inputs)
	return ar_developerportal_components_appdetailsstep_hardblockdesc5(inputs)
});
export { developerportal_components_appdetailsstep_hardblockdesc5 as "developerPortal.components.appDetailsStep.hardBlockDesc" }