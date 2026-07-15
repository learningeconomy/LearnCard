/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Connect_Showqr1Inputs */

const en_troops_connect_showqr1 = /** @type {(inputs: Troops_Connect_Showqr1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show QR Code`)
};

const es_troops_connect_showqr1 = /** @type {(inputs: Troops_Connect_Showqr1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar Código QR`)
};

const fr_troops_connect_showqr1 = /** @type {(inputs: Troops_Connect_Showqr1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher le code QR`)
};

const ar_troops_connect_showqr1 = /** @type {(inputs: Troops_Connect_Showqr1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show QR Code`)
};

/**
* | output |
* | --- |
* | "Show QR Code" |
*
* @param {Troops_Connect_Showqr1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_connect_showqr1 = /** @type {((inputs?: Troops_Connect_Showqr1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Connect_Showqr1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_connect_showqr1(inputs)
	if (locale === "es") return es_troops_connect_showqr1(inputs)
	if (locale === "fr") return fr_troops_connect_showqr1(inputs)
	return ar_troops_connect_showqr1(inputs)
});
export { troops_connect_showqr1 as "troops.connect.showQr" }