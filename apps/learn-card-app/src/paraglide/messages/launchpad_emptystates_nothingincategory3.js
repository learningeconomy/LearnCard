/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ category: NonNullable<unknown> }} Launchpad_Emptystates_Nothingincategory3Inputs */

const en_launchpad_emptystates_nothingincategory3 = /** @type {(inputs: Launchpad_Emptystates_Nothingincategory3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Nothing in ${i?.category} yet`)
};

const es_launchpad_emptystates_nothingincategory3 = /** @type {(inputs: Launchpad_Emptystates_Nothingincategory3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Nada en ${i?.category} todavía`)
};

const de_launchpad_emptystates_nothingincategory3 = /** @type {(inputs: Launchpad_Emptystates_Nothingincategory3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Noch nichts in ${i?.category}`)
};

const ar_launchpad_emptystates_nothingincategory3 = /** @type {(inputs: Launchpad_Emptystates_Nothingincategory3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`لا يوجد شيء في ${i?.category} بعد`)
};

const fr_launchpad_emptystates_nothingincategory3 = /** @type {(inputs: Launchpad_Emptystates_Nothingincategory3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Rien dans ${i?.category} pour le moment`)
};

const ko_launchpad_emptystates_nothingincategory3 = /** @type {(inputs: Launchpad_Emptystates_Nothingincategory3Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.category}에 아직 아무것도 없습니다`)
};

/**
* | output |
* | --- |
* | "Nothing in {category} yet" |
*
* @param {Launchpad_Emptystates_Nothingincategory3Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_emptystates_nothingincategory3 = /** @type {((inputs: Launchpad_Emptystates_Nothingincategory3Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Emptystates_Nothingincategory3Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_emptystates_nothingincategory3(inputs)
	if (locale === "es") return es_launchpad_emptystates_nothingincategory3(inputs)
	if (locale === "de") return de_launchpad_emptystates_nothingincategory3(inputs)
	if (locale === "ar") return ar_launchpad_emptystates_nothingincategory3(inputs)
	if (locale === "fr") return fr_launchpad_emptystates_nothingincategory3(inputs)
	return ko_launchpad_emptystates_nothingincategory3(inputs)
});
export { launchpad_emptystates_nothingincategory3 as "launchpad.emptyStates.nothingInCategory" }