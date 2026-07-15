/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Connect_BrowseInputs */

const en_troops_connect_browse = /** @type {(inputs: Troops_Connect_BrowseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browse Contacts`)
};

const es_troops_connect_browse = /** @type {(inputs: Troops_Connect_BrowseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar Contactos`)
};

const fr_troops_connect_browse = /** @type {(inputs: Troops_Connect_BrowseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcourir les contacts`)
};

const ar_troops_connect_browse = /** @type {(inputs: Troops_Connect_BrowseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصفح جهات الاتصال`)
};

/**
* | output |
* | --- |
* | "Browse Contacts" |
*
* @param {Troops_Connect_BrowseInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_connect_browse = /** @type {((inputs?: Troops_Connect_BrowseInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Connect_BrowseInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_connect_browse(inputs)
	if (locale === "es") return es_troops_connect_browse(inputs)
	if (locale === "fr") return fr_troops_connect_browse(inputs)
	return ar_troops_connect_browse(inputs)
});
export { troops_connect_browse as "troops.connect.browse" }