/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boost_Cms_QuitInputs */

const en_boost_cms_quit = /** @type {(inputs: Boost_Cms_QuitInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quit`)
};

const es_boost_cms_quit = /** @type {(inputs: Boost_Cms_QuitInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Salir`)
};

const fr_boost_cms_quit = /** @type {(inputs: Boost_Cms_QuitInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Quitter`)
};

const ar_boost_cms_quit = /** @type {(inputs: Boost_Cms_QuitInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`خروج`)
};

/**
* | output |
* | --- |
* | "Quit" |
*
* @param {Boost_Cms_QuitInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boost_cms_quit = /** @type {((inputs?: Boost_Cms_QuitInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boost_Cms_QuitInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boost_cms_quit(inputs)
	if (locale === "es") return es_boost_cms_quit(inputs)
	if (locale === "fr") return fr_boost_cms_quit(inputs)
	return ar_boost_cms_quit(inputs)
});
export { boost_cms_quit as "boost.cms.quit" }