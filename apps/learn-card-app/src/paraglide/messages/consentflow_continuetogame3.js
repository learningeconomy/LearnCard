/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Continuetogame3Inputs */

const en_consentflow_continuetogame3 = /** @type {(inputs: Consentflow_Continuetogame3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue to Game`)
};

const es_consentflow_continuetogame3 = /** @type {(inputs: Consentflow_Continuetogame3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar al juego`)
};

const fr_consentflow_continuetogame3 = /** @type {(inputs: Consentflow_Continuetogame3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer vers le jeu`)
};

const ar_consentflow_continuetogame3 = /** @type {(inputs: Consentflow_Continuetogame3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة إلى اللعبة`)
};

/**
* | output |
* | --- |
* | "Continue to Game" |
*
* @param {Consentflow_Continuetogame3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_continuetogame3 = /** @type {((inputs?: Consentflow_Continuetogame3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Continuetogame3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_continuetogame3(inputs)
	if (locale === "es") return es_consentflow_continuetogame3(inputs)
	if (locale === "fr") return fr_consentflow_continuetogame3(inputs)
	return ar_consentflow_continuetogame3(inputs)
});
export { consentflow_continuetogame3 as "consentFlow.continueToGame" }