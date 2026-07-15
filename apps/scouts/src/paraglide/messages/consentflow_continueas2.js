/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Continueas2Inputs */

const en_consentflow_continueas2 = /** @type {(inputs: Consentflow_Continueas2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continue as {name}`)
};

const es_consentflow_continueas2 = /** @type {(inputs: Consentflow_Continueas2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuar como {name}`)
};

const fr_consentflow_continueas2 = /** @type {(inputs: Consentflow_Continueas2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Continuer en tant que {name}`)
};

const ar_consentflow_continueas2 = /** @type {(inputs: Consentflow_Continueas2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`المتابعة كـ {name}`)
};

/**
* | output |
* | --- |
* | "Continue as {name}" |
*
* @param {Consentflow_Continueas2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_continueas2 = /** @type {((inputs?: Consentflow_Continueas2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Continueas2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_continueas2(inputs)
	if (locale === "es") return es_consentflow_continueas2(inputs)
	if (locale === "fr") return fr_consentflow_continueas2(inputs)
	return ar_consentflow_continueas2(inputs)
});
export { consentflow_continueas2 as "consentFlow.continueAs" }