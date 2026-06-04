/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_LinksInputs */

const en_launchpad_detail_links = /** @type {(inputs: Launchpad_Detail_LinksInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Links`)
};

const es_launchpad_detail_links = /** @type {(inputs: Launchpad_Detail_LinksInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enlaces`)
};

const de_launchpad_detail_links = /** @type {(inputs: Launchpad_Detail_LinksInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Links`)
};

const ar_launchpad_detail_links = /** @type {(inputs: Launchpad_Detail_LinksInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`روابط`)
};

const fr_launchpad_detail_links = /** @type {(inputs: Launchpad_Detail_LinksInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liens`)
};

const ko_launchpad_detail_links = /** @type {(inputs: Launchpad_Detail_LinksInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`링크`)
};

/**
* | output |
* | --- |
* | "Links" |
*
* @param {Launchpad_Detail_LinksInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_links = /** @type {((inputs?: Launchpad_Detail_LinksInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_LinksInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_links(inputs)
	if (locale === "es") return es_launchpad_detail_links(inputs)
	if (locale === "de") return de_launchpad_detail_links(inputs)
	if (locale === "ar") return ar_launchpad_detail_links(inputs)
	if (locale === "fr") return fr_launchpad_detail_links(inputs)
	return ko_launchpad_detail_links(inputs)
});
export { launchpad_detail_links as "launchpad.detail.links" }