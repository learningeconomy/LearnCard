/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Connect_ShareInputs */

const en_troops_connect_share = /** @type {(inputs: Troops_Connect_ShareInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share Link`)
};

const es_troops_connect_share = /** @type {(inputs: Troops_Connect_ShareInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir Enlace`)
};

const fr_troops_connect_share = /** @type {(inputs: Troops_Connect_ShareInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager le lien`)
};

const ar_troops_connect_share = /** @type {(inputs: Troops_Connect_ShareInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share Link`)
};

/**
* | output |
* | --- |
* | "Share Link" |
*
* @param {Troops_Connect_ShareInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_connect_share = /** @type {((inputs?: Troops_Connect_ShareInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Connect_ShareInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_connect_share(inputs)
	if (locale === "es") return es_troops_connect_share(inputs)
	if (locale === "fr") return fr_troops_connect_share(inputs)
	return ar_troops_connect_share(inputs)
});
export { troops_connect_share as "troops.connect.share" }