/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scoutnews_Viewpost2Inputs */

const en_scoutnews_viewpost2 = /** @type {(inputs: Scoutnews_Viewpost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Post`)
};

const es_scoutnews_viewpost2 = /** @type {(inputs: Scoutnews_Viewpost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver Publicación`)
};

const fr_scoutnews_viewpost2 = /** @type {(inputs: Scoutnews_Viewpost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir l'article`)
};

const ar_scoutnews_viewpost2 = /** @type {(inputs: Scoutnews_Viewpost2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Post`)
};

/**
* | output |
* | --- |
* | "View Post" |
*
* @param {Scoutnews_Viewpost2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scoutnews_viewpost2 = /** @type {((inputs?: Scoutnews_Viewpost2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scoutnews_Viewpost2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scoutnews_viewpost2(inputs)
	if (locale === "es") return es_scoutnews_viewpost2(inputs)
	if (locale === "fr") return fr_scoutnews_viewpost2(inputs)
	return ar_scoutnews_viewpost2(inputs)
});
export { scoutnews_viewpost2 as "scoutNews.viewPost" }