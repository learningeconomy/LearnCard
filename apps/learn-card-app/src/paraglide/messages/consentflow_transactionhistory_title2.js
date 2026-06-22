/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Transactionhistory_Title2Inputs */

const en_consentflow_transactionhistory_title2 = /** @type {(inputs: Consentflow_Transactionhistory_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Transaction History`)
};

const es_consentflow_transactionhistory_title2 = /** @type {(inputs: Consentflow_Transactionhistory_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historial de transacciones`)
};

const fr_consentflow_transactionhistory_title2 = /** @type {(inputs: Consentflow_Transactionhistory_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Historique des transactions`)
};

const ar_consentflow_transactionhistory_title2 = /** @type {(inputs: Consentflow_Transactionhistory_Title2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سجل المعاملات`)
};

/**
* | output |
* | --- |
* | "Transaction History" |
*
* @param {Consentflow_Transactionhistory_Title2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_transactionhistory_title2 = /** @type {((inputs?: Consentflow_Transactionhistory_Title2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Transactionhistory_Title2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_transactionhistory_title2(inputs)
	if (locale === "es") return es_consentflow_transactionhistory_title2(inputs)
	if (locale === "fr") return fr_consentflow_transactionhistory_title2(inputs)
	return ar_consentflow_transactionhistory_title2(inputs)
});
export { consentflow_transactionhistory_title2 as "consentFlow.transactionHistory.title" }