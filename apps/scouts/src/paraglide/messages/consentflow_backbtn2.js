/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Backbtn2Inputs */

const en_consentflow_backbtn2 = /** @type {(inputs: Consentflow_Backbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Back button`)
};

const es_consentflow_backbtn2 = /** @type {(inputs: Consentflow_Backbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Botón de retroceso`)
};

const fr_consentflow_backbtn2 = /** @type {(inputs: Consentflow_Backbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Bouton retour`)
};

const ar_consentflow_backbtn2 = /** @type {(inputs: Consentflow_Backbtn2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`زر الرجوع`)
};

/**
* | output |
* | --- |
* | "Back button" |
*
* @param {Consentflow_Backbtn2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_backbtn2 = /** @type {((inputs?: Consentflow_Backbtn2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Backbtn2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_backbtn2(inputs)
	if (locale === "es") return es_consentflow_backbtn2(inputs)
	if (locale === "fr") return fr_consentflow_backbtn2(inputs)
	return ar_consentflow_backbtn2(inputs)
});
export { consentflow_backbtn2 as "consentFlow.backBtn" }