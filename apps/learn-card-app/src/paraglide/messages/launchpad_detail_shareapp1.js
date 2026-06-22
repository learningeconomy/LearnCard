/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_Shareapp1Inputs */

const en_launchpad_detail_shareapp1 = /** @type {(inputs: Launchpad_Detail_Shareapp1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share App`)
};

const es_launchpad_detail_shareapp1 = /** @type {(inputs: Launchpad_Detail_Shareapp1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir app`)
};

const fr_launchpad_detail_shareapp1 = /** @type {(inputs: Launchpad_Detail_Shareapp1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager l'app`)
};

const ar_launchpad_detail_shareapp1 = /** @type {(inputs: Launchpad_Detail_Shareapp1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة التطبيق`)
};

/**
* | output |
* | --- |
* | "Share App" |
*
* @param {Launchpad_Detail_Shareapp1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_shareapp1 = /** @type {((inputs?: Launchpad_Detail_Shareapp1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_Shareapp1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_shareapp1(inputs)
	if (locale === "es") return es_launchpad_detail_shareapp1(inputs)
	if (locale === "fr") return fr_launchpad_detail_shareapp1(inputs)
	return ar_launchpad_detail_shareapp1(inputs)
});
export { launchpad_detail_shareapp1 as "launchpad.detail.shareApp" }