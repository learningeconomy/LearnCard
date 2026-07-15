/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Allowdatatolc5Inputs */

const en_consentflow_allowdatatolc5 = /** @type {(inputs: Consentflow_Allowdatatolc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Allow Data to be Added to Your LearnCard`)
};

const es_consentflow_allowdatatolc5 = /** @type {(inputs: Consentflow_Allowdatatolc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Permitir que se Añadan Datos a Tu LearnCard`)
};

const fr_consentflow_allowdatatolc5 = /** @type {(inputs: Consentflow_Allowdatatolc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Autoriser l'ajout de données à votre LearnCard`)
};

const ar_consentflow_allowdatatolc5 = /** @type {(inputs: Consentflow_Allowdatatolc5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`السماح بإضافة البيانات إلى LearnCard الخاص بك`)
};

/**
* | output |
* | --- |
* | "Allow Data to be Added to Your LearnCard" |
*
* @param {Consentflow_Allowdatatolc5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_allowdatatolc5 = /** @type {((inputs?: Consentflow_Allowdatatolc5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Allowdatatolc5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_allowdatatolc5(inputs)
	if (locale === "es") return es_consentflow_allowdatatolc5(inputs)
	if (locale === "fr") return fr_consentflow_allowdatatolc5(inputs)
	return ar_consentflow_allowdatatolc5(inputs)
});
export { consentflow_allowdatatolc5 as "consentFlow.allowDataToLC" }