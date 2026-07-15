/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Troops_Usenetworkstyles2Inputs */

const en_troops_usenetworkstyles2 = /** @type {(inputs: Troops_Usenetworkstyles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use network styles`)
};

const es_troops_usenetworkstyles2 = /** @type {(inputs: Troops_Usenetworkstyles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Usar estilos de la red`)
};

const fr_troops_usenetworkstyles2 = /** @type {(inputs: Troops_Usenetworkstyles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Utiliser les styles du réseau`)
};

const ar_troops_usenetworkstyles2 = /** @type {(inputs: Troops_Usenetworkstyles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Use network styles`)
};

/**
* | output |
* | --- |
* | "Use network styles" |
*
* @param {Troops_Usenetworkstyles2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const troops_usenetworkstyles2 = /** @type {((inputs?: Troops_Usenetworkstyles2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Troops_Usenetworkstyles2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_troops_usenetworkstyles2(inputs)
	if (locale === "es") return es_troops_usenetworkstyles2(inputs)
	if (locale === "fr") return fr_troops_usenetworkstyles2(inputs)
	return ar_troops_usenetworkstyles2(inputs)
});
export { troops_usenetworkstyles2 as "troops.useNetworkStyles" }