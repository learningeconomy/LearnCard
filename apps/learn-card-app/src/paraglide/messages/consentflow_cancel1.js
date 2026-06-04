/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Cancel1Inputs */

const en_consentflow_cancel1 = /** @type {(inputs: Consentflow_Cancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancel`)
};

const es_consentflow_cancel1 = /** @type {(inputs: Consentflow_Cancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancelar`)
};

const de_consentflow_cancel1 = /** @type {(inputs: Consentflow_Cancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Abbrechen`)
};

const ar_consentflow_cancel1 = /** @type {(inputs: Consentflow_Cancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء`)
};

const fr_consentflow_cancel1 = /** @type {(inputs: Consentflow_Cancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler`)
};

const ko_consentflow_cancel1 = /** @type {(inputs: Consentflow_Cancel1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`취소`)
};

/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Consentflow_Cancel1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_cancel1 = /** @type {((inputs?: Consentflow_Cancel1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Cancel1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_cancel1(inputs)
	if (locale === "es") return es_consentflow_cancel1(inputs)
	if (locale === "de") return de_consentflow_cancel1(inputs)
	if (locale === "ar") return ar_consentflow_cancel1(inputs)
	if (locale === "fr") return fr_consentflow_cancel1(inputs)
	return ko_consentflow_cancel1(inputs)
});
export { consentflow_cancel1 as "consentFlow.cancel" }