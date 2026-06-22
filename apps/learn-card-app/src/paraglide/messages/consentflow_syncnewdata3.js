/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Syncnewdata3Inputs */

const en_consentflow_syncnewdata3 = /** @type {(inputs: Consentflow_Syncnewdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sync New Data`)
};

const es_consentflow_syncnewdata3 = /** @type {(inputs: Consentflow_Syncnewdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sincronizar datos nuevos`)
};

const fr_consentflow_syncnewdata3 = /** @type {(inputs: Consentflow_Syncnewdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Synchroniser les nouvelles données`)
};

const ar_consentflow_syncnewdata3 = /** @type {(inputs: Consentflow_Syncnewdata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مزامنة بيانات جديدة`)
};

/**
* | output |
* | --- |
* | "Sync New Data" |
*
* @param {Consentflow_Syncnewdata3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_syncnewdata3 = /** @type {((inputs?: Consentflow_Syncnewdata3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Syncnewdata3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_syncnewdata3(inputs)
	if (locale === "es") return es_consentflow_syncnewdata3(inputs)
	if (locale === "fr") return fr_consentflow_syncnewdata3(inputs)
	return ar_consentflow_syncnewdata3(inputs)
});
export { consentflow_syncnewdata3 as "consentFlow.syncNewData" }