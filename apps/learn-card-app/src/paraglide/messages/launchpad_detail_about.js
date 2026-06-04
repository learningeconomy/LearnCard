/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_AboutInputs */

const en_launchpad_detail_about = /** @type {(inputs: Launchpad_Detail_AboutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`About`)
};

const es_launchpad_detail_about = /** @type {(inputs: Launchpad_Detail_AboutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acerca de`)
};

const de_launchpad_detail_about = /** @type {(inputs: Launchpad_Detail_AboutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Über`)
};

const ar_launchpad_detail_about = /** @type {(inputs: Launchpad_Detail_AboutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حول`)
};

const fr_launchpad_detail_about = /** @type {(inputs: Launchpad_Detail_AboutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`À propos`)
};

const ko_launchpad_detail_about = /** @type {(inputs: Launchpad_Detail_AboutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`정보`)
};

/**
* | output |
* | --- |
* | "About" |
*
* @param {Launchpad_Detail_AboutInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_about = /** @type {((inputs?: Launchpad_Detail_AboutInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_AboutInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_about(inputs)
	if (locale === "es") return es_launchpad_detail_about(inputs)
	if (locale === "de") return de_launchpad_detail_about(inputs)
	if (locale === "ar") return ar_launchpad_detail_about(inputs)
	if (locale === "fr") return fr_launchpad_detail_about(inputs)
	return ko_launchpad_detail_about(inputs)
});
export { launchpad_detail_about as "launchpad.detail.about" }