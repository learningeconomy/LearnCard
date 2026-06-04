/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Update1Inputs */

const en_consentflow_update1 = /** @type {(inputs: Consentflow_Update1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update`)
};

const es_consentflow_update1 = /** @type {(inputs: Consentflow_Update1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizar`)
};

const de_consentflow_update1 = /** @type {(inputs: Consentflow_Update1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aktualisieren`)
};

const ar_consentflow_update1 = /** @type {(inputs: Consentflow_Update1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحديث`)
};

const fr_consentflow_update1 = /** @type {(inputs: Consentflow_Update1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mettre à jour`)
};

const ko_consentflow_update1 = /** @type {(inputs: Consentflow_Update1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`업데이트`)
};

/**
* | output |
* | --- |
* | "Update" |
*
* @param {Consentflow_Update1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_update1 = /** @type {((inputs?: Consentflow_Update1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Update1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_update1(inputs)
	if (locale === "es") return es_consentflow_update1(inputs)
	if (locale === "de") return de_consentflow_update1(inputs)
	if (locale === "ar") return ar_consentflow_update1(inputs)
	if (locale === "fr") return fr_consentflow_update1(inputs)
	return ko_consentflow_update1(inputs)
});
export { consentflow_update1 as "consentFlow.update" }