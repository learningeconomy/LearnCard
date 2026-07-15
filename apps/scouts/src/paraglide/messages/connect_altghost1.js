/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Connect_Altghost1Inputs */

const en_connect_altghost1 = /** @type {(inputs: Connect_Altghost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`ghost`)
};

const es_connect_altghost1 = /** @type {(inputs: Connect_Altghost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`fantasma`)
};

const fr_connect_altghost1 = /** @type {(inputs: Connect_Altghost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`fantôme`)
};

const ar_connect_altghost1 = /** @type {(inputs: Connect_Altghost1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`شبح`)
};

/**
* | output |
* | --- |
* | "ghost" |
*
* @param {Connect_Altghost1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const connect_altghost1 = /** @type {((inputs?: Connect_Altghost1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Connect_Altghost1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_connect_altghost1(inputs)
	if (locale === "es") return es_connect_altghost1(inputs)
	if (locale === "fr") return fr_connect_altghost1(inputs)
	return ar_connect_altghost1(inputs)
});
export { connect_altghost1 as "connect.altGhost" }