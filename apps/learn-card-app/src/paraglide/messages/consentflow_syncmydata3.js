/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Syncmydata3Inputs */

const en_consentflow_syncmydata3 = /** @type {(inputs: Consentflow_Syncmydata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sync My Data`)
};

const es_consentflow_syncmydata3 = /** @type {(inputs: Consentflow_Syncmydata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sincronizar mis datos`)
};

const fr_consentflow_syncmydata3 = /** @type {(inputs: Consentflow_Syncmydata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Synchroniser mes données`)
};

const ar_consentflow_syncmydata3 = /** @type {(inputs: Consentflow_Syncmydata3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مزامنة بياناتي`)
};

/**
* | output |
* | --- |
* | "Sync My Data" |
*
* @param {Consentflow_Syncmydata3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_syncmydata3 = /** @type {((inputs?: Consentflow_Syncmydata3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Syncmydata3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_syncmydata3(inputs)
	if (locale === "es") return es_consentflow_syncmydata3(inputs)
	if (locale === "fr") return fr_consentflow_syncmydata3(inputs)
	return ar_consentflow_syncmydata3(inputs)
});
export { consentflow_syncmydata3 as "consentFlow.syncMyData" }