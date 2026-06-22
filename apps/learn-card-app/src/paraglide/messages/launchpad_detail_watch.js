/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Detail_WatchInputs */

const en_launchpad_detail_watch = /** @type {(inputs: Launchpad_Detail_WatchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Watch`)
};

const es_launchpad_detail_watch = /** @type {(inputs: Launchpad_Detail_WatchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver`)
};

const fr_launchpad_detail_watch = /** @type {(inputs: Launchpad_Detail_WatchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Regarder`)
};

const ar_launchpad_detail_watch = /** @type {(inputs: Launchpad_Detail_WatchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاهدة`)
};

/**
* | output |
* | --- |
* | "Watch" |
*
* @param {Launchpad_Detail_WatchInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_detail_watch = /** @type {((inputs?: Launchpad_Detail_WatchInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Detail_WatchInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_detail_watch(inputs)
	if (locale === "es") return es_launchpad_detail_watch(inputs)
	if (locale === "fr") return fr_launchpad_detail_watch(inputs)
	return ar_launchpad_detail_watch(inputs)
});
export { launchpad_detail_watch as "launchpad.detail.watch" }