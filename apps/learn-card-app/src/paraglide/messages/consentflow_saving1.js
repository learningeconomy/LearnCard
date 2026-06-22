/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Saving1Inputs */

const en_consentflow_saving1 = /** @type {(inputs: Consentflow_Saving1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saving...`)
};

const es_consentflow_saving1 = /** @type {(inputs: Consentflow_Saving1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardando...`)
};

const fr_consentflow_saving1 = /** @type {(inputs: Consentflow_Saving1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrement...`)
};

const ar_consentflow_saving1 = /** @type {(inputs: Consentflow_Saving1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...حفظ`)
};

/**
* | output |
* | --- |
* | "Saving..." |
*
* @param {Consentflow_Saving1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_saving1 = /** @type {((inputs?: Consentflow_Saving1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Saving1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_saving1(inputs)
	if (locale === "es") return es_consentflow_saving1(inputs)
	if (locale === "fr") return fr_consentflow_saving1(inputs)
	return ar_consentflow_saving1(inputs)
});
export { consentflow_saving1 as "consentFlow.saving" }