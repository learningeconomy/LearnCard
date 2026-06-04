/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Errorloading2Inputs */

const en_consentflow_errorloading2 = /** @type {(inputs: Consentflow_Errorloading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`There was a problem loading this Consent Flow.`)
};

const es_consentflow_errorloading2 = /** @type {(inputs: Consentflow_Errorloading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hubo un problema al cargar este flujo de consentimiento.`)
};

const de_consentflow_errorloading2 = /** @type {(inputs: Consentflow_Errorloading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Beim Laden dieses Zustimmungsflusses ist ein Problem aufgetreten.`)
};

const ar_consentflow_errorloading2 = /** @type {(inputs: Consentflow_Errorloading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدثت مشكلة في تحميل تدفق الموافقة هذا.`)
};

const fr_consentflow_errorloading2 = /** @type {(inputs: Consentflow_Errorloading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un problème est survenu lors du chargement de ce flux de consentement.`)
};

const ko_consentflow_errorloading2 = /** @type {(inputs: Consentflow_Errorloading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 동의 흐름을 로드하는 중 문제가 발생했습니다.`)
};

/**
* | output |
* | --- |
* | "There was a problem loading this Consent Flow." |
*
* @param {Consentflow_Errorloading2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_errorloading2 = /** @type {((inputs?: Consentflow_Errorloading2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Errorloading2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_errorloading2(inputs)
	if (locale === "es") return es_consentflow_errorloading2(inputs)
	if (locale === "de") return de_consentflow_errorloading2(inputs)
	if (locale === "ar") return ar_consentflow_errorloading2(inputs)
	if (locale === "fr") return fr_consentflow_errorloading2(inputs)
	return ko_consentflow_errorloading2(inputs)
});
export { consentflow_errorloading2 as "consentFlow.errorLoading" }