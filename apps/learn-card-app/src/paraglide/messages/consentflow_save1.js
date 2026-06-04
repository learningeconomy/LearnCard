/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Save1Inputs */

const en_consentflow_save1 = /** @type {(inputs: Consentflow_Save1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Save`)
};

const es_consentflow_save1 = /** @type {(inputs: Consentflow_Save1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardar`)
};

const de_consentflow_save1 = /** @type {(inputs: Consentflow_Save1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Speichern`)
};

const ar_consentflow_save1 = /** @type {(inputs: Consentflow_Save1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حفظ`)
};

const fr_consentflow_save1 = /** @type {(inputs: Consentflow_Save1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer`)
};

const ko_consentflow_save1 = /** @type {(inputs: Consentflow_Save1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`저장`)
};

/**
* | output |
* | --- |
* | "Save" |
*
* @param {Consentflow_Save1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_save1 = /** @type {((inputs?: Consentflow_Save1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Save1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_save1(inputs)
	if (locale === "es") return es_consentflow_save1(inputs)
	if (locale === "de") return de_consentflow_save1(inputs)
	if (locale === "ar") return ar_consentflow_save1(inputs)
	if (locale === "fr") return fr_consentflow_save1(inputs)
	return ko_consentflow_save1(inputs)
});
export { consentflow_save1 as "consentFlow.save" }