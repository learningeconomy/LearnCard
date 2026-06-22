/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_Moreoptions1Inputs */

const en_launchpad_detail_moreoptions1 = /** @type {(inputs: Launchpad_Detail_Moreoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`More options`)
};

const es_launchpad_detail_moreoptions1 = /** @type {(inputs: Launchpad_Detail_Moreoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Más opciones`)
};

const fr_launchpad_detail_moreoptions1 = /** @type {(inputs: Launchpad_Detail_Moreoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Plus d'options`)
};

const ar_launchpad_detail_moreoptions1 = /** @type {(inputs: Launchpad_Detail_Moreoptions1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المزيد من الخيارات`)
};

/**
* | output |
* | --- |
* | "More options" |
*
* @param {Launchpad_Detail_Moreoptions1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_moreoptions1 = /** @type {((inputs?: Launchpad_Detail_Moreoptions1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_Moreoptions1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_moreoptions1(inputs)
	if (locale === "es") return es_launchpad_detail_moreoptions1(inputs)
	if (locale === "fr") return fr_launchpad_detail_moreoptions1(inputs)
	return ar_launchpad_detail_moreoptions1(inputs)
});
export { launchpad_detail_moreoptions1 as "launchpad.detail.moreOptions" }