/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Latestnews2Inputs */

const en_launchpad_latestnews2 = /** @type {(inputs: Launchpad_Latestnews2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Latest News`)
};

const es_launchpad_latestnews2 = /** @type {(inputs: Launchpad_Latestnews2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Últimas Noticias`)
};

const fr_launchpad_latestnews2 = /** @type {(inputs: Launchpad_Latestnews2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dernières actualités`)
};

const ar_launchpad_latestnews2 = /** @type {(inputs: Launchpad_Latestnews2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Latest News`)
};

/**
* | output |
* | --- |
* | "Latest News" |
*
* @param {Launchpad_Latestnews2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_latestnews2 = /** @type {((inputs?: Launchpad_Latestnews2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Latestnews2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_latestnews2(inputs)
	if (locale === "es") return es_launchpad_latestnews2(inputs)
	if (locale === "fr") return fr_launchpad_latestnews2(inputs)
	return ar_launchpad_latestnews2(inputs)
});
export { launchpad_latestnews2 as "launchPad.latestNews" }