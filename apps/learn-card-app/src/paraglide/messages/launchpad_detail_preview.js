/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_PreviewInputs */

const en_launchpad_detail_preview = /** @type {(inputs: Launchpad_Detail_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Preview`)
};

const es_launchpad_detail_preview = /** @type {(inputs: Launchpad_Detail_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vista previa`)
};

const de_launchpad_detail_preview = /** @type {(inputs: Launchpad_Detail_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vorschau`)
};

const ar_launchpad_detail_preview = /** @type {(inputs: Launchpad_Detail_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`معاينة`)
};

const fr_launchpad_detail_preview = /** @type {(inputs: Launchpad_Detail_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aperçu`)
};

const ko_launchpad_detail_preview = /** @type {(inputs: Launchpad_Detail_PreviewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`미리보기`)
};

/**
* | output |
* | --- |
* | "Preview" |
*
* @param {Launchpad_Detail_PreviewInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_preview = /** @type {((inputs?: Launchpad_Detail_PreviewInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_PreviewInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_preview(inputs)
	if (locale === "es") return es_launchpad_detail_preview(inputs)
	if (locale === "de") return de_launchpad_detail_preview(inputs)
	if (locale === "ar") return ar_launchpad_detail_preview(inputs)
	if (locale === "fr") return fr_launchpad_detail_preview(inputs)
	return ko_launchpad_detail_preview(inputs)
});
export { launchpad_detail_preview as "launchpad.detail.preview" }