/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Continueplaying2Inputs */

const en_consentflow_continueplaying2 = /** @type {(inputs: Consentflow_Continueplaying2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue Playing`)
};

const es_consentflow_continueplaying2 = /** @type {(inputs: Consentflow_Continueplaying2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Seguir jugando`)
};

const fr_consentflow_continueplaying2 = /** @type {(inputs: Consentflow_Continueplaying2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer à jouer`)
};

const ar_consentflow_continueplaying2 = /** @type {(inputs: Consentflow_Continueplaying2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`متابعة اللعب`)
};

/**
* | output |
* | --- |
* | "Continue Playing" |
*
* @param {Consentflow_Continueplaying2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_continueplaying2 = /** @type {((inputs?: Consentflow_Continueplaying2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Continueplaying2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_continueplaying2(inputs)
	if (locale === "es") return es_consentflow_continueplaying2(inputs)
	if (locale === "fr") return fr_consentflow_continueplaying2(inputs)
	return ar_consentflow_continueplaying2(inputs)
});
export { consentflow_continueplaying2 as "consentFlow.continuePlaying" }