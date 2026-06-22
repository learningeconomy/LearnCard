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

const fr_consentflow_errorloading2 = /** @type {(inputs: Consentflow_Errorloading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Un problème est survenu lors du chargement de ce flux de consentement.`)
};

const ar_consentflow_errorloading2 = /** @type {(inputs: Consentflow_Errorloading2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدثت مشكلة في تحميل تدفق الموافقة هذا.`)
};

/**
* | output |
* | --- |
* | "There was a problem loading this Consent Flow." |
*
* @param {Consentflow_Errorloading2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_errorloading2 = /** @type {((inputs?: Consentflow_Errorloading2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Errorloading2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_errorloading2(inputs)
	if (locale === "es") return es_consentflow_errorloading2(inputs)
	if (locale === "fr") return fr_consentflow_errorloading2(inputs)
	return ar_consentflow_errorloading2(inputs)
});
export { consentflow_errorloading2 as "consentFlow.errorLoading" }