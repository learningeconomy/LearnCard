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

const fr_launchpad_detail_links = /** @type {(inputs: Launchpad_Detail_LinksInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Liens`)
};

const ar_launchpad_detail_links = /** @type {(inputs: Launchpad_Detail_LinksInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`روابط`)
};

/**
* | output |
* | --- |
* | "Links" |
*
* @param {Launchpad_Detail_LinksInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_links = /** @type {((inputs?: Launchpad_Detail_LinksInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_LinksInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_links(inputs)
	if (locale === "es") return es_launchpad_detail_links(inputs)
	if (locale === "fr") return fr_launchpad_detail_links(inputs)
	return ar_launchpad_detail_links(inputs)
});
export { launchpad_detail_links as "launchpad.detail.links" }