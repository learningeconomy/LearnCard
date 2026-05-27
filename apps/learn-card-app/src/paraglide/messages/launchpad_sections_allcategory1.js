/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ category: NonNullable<unknown> }} Launchpad_Sections_Allcategory1Inputs */

const en_launchpad_sections_allcategory1 = /** @type {(inputs: Launchpad_Sections_Allcategory1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`All ${i?.category}`)
};

const es_launchpad_sections_allcategory1 = /** @type {(inputs: Launchpad_Sections_Allcategory1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Todas: ${i?.category}`)
};

const de_launchpad_sections_allcategory1 = /** @type {(inputs: Launchpad_Sections_Allcategory1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Alle: ${i?.category}`)
};

const ar_launchpad_sections_allcategory1 = /** @type {(inputs: Launchpad_Sections_Allcategory1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`الكل: ${i?.category}`)
};

/**
* | output |
* | --- |
* | "All {category}" |
*
* @param {Launchpad_Sections_Allcategory1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_sections_allcategory1 = /** @type {((inputs: Launchpad_Sections_Allcategory1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Sections_Allcategory1Inputs, { locale?: "en" | "es" | "de" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_sections_allcategory1(inputs)
	if (locale === "es") return es_launchpad_sections_allcategory1(inputs)
	if (locale === "de") return de_launchpad_sections_allcategory1(inputs)
	return ar_launchpad_sections_allcategory1(inputs)
});
export { launchpad_sections_allcategory1 as "launchpad.sections.allCategory" }