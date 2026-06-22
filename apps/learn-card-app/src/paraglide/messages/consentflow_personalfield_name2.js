/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Personalfield_Name2Inputs */

const en_consentflow_personalfield_name2 = /** @type {(inputs: Consentflow_Personalfield_Name2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`name`)
};

const es_consentflow_personalfield_name2 = /** @type {(inputs: Consentflow_Personalfield_Name2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`nombre`)
};

const fr_consentflow_personalfield_name2 = /** @type {(inputs: Consentflow_Personalfield_Name2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`nom`)
};

const ar_consentflow_personalfield_name2 = /** @type {(inputs: Consentflow_Personalfield_Name2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاسم`)
};

/**
* | output |
* | --- |
* | "name" |
*
* @param {Consentflow_Personalfield_Name2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_personalfield_name2 = /** @type {((inputs?: Consentflow_Personalfield_Name2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Personalfield_Name2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_personalfield_name2(inputs)
	if (locale === "es") return es_consentflow_personalfield_name2(inputs)
	if (locale === "fr") return fr_consentflow_personalfield_name2(inputs)
	return ar_consentflow_personalfield_name2(inputs)
});
export { consentflow_personalfield_name2 as "consentFlow.personalField.name" }