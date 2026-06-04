/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ error: NonNullable<unknown> }} Toasts_Consentflow_Acceptfailed2Inputs */

const en_toasts_consentflow_acceptfailed2 = /** @type {(inputs: Toasts_Consentflow_Acceptfailed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Failed to accept contract: ${i?.error}`)
};

const es_toasts_consentflow_acceptfailed2 = /** @type {(inputs: Toasts_Consentflow_Acceptfailed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error al aceptar el contrato: ${i?.error}`)
};

const de_toasts_consentflow_acceptfailed2 = /** @type {(inputs: Toasts_Consentflow_Acceptfailed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Vertragsannahme fehlgeschlagen: ${i?.error}`)
};

const ar_toasts_consentflow_acceptfailed2 = /** @type {(inputs: Toasts_Consentflow_Acceptfailed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`فشل قبول العقد: ${i?.error}`)
};

const fr_toasts_consentflow_acceptfailed2 = /** @type {(inputs: Toasts_Consentflow_Acceptfailed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Échec de l'acceptation du contrat : ${i?.error}`)
};

const ko_toasts_consentflow_acceptfailed2 = /** @type {(inputs: Toasts_Consentflow_Acceptfailed2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`계약 수락 실패: ${i?.error}`)
};

/**
* | output |
* | --- |
* | "Failed to accept contract: {error}" |
*
* @param {Toasts_Consentflow_Acceptfailed2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_consentflow_acceptfailed2 = /** @type {((inputs: Toasts_Consentflow_Acceptfailed2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Consentflow_Acceptfailed2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_consentflow_acceptfailed2(inputs)
	if (locale === "es") return es_toasts_consentflow_acceptfailed2(inputs)
	if (locale === "de") return de_toasts_consentflow_acceptfailed2(inputs)
	if (locale === "ar") return ar_toasts_consentflow_acceptfailed2(inputs)
	if (locale === "fr") return fr_toasts_consentflow_acceptfailed2(inputs)
	return ko_toasts_consentflow_acceptfailed2(inputs)
});
export { toasts_consentflow_acceptfailed2 as "toasts.consentFlow.acceptFailed" }