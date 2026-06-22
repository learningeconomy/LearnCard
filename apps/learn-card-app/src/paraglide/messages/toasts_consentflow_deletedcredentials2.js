/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ count: NonNullable<unknown>, name: NonNullable<unknown> }} Toasts_Consentflow_Deletedcredentials2Inputs */

const en_toasts_consentflow_deletedcredentials2 = /** @type {(inputs: Toasts_Consentflow_Deletedcredentials2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Deleted ${i?.count} credentials from contract ${i?.name}`)
};

const es_toasts_consentflow_deletedcredentials2 = /** @type {(inputs: Toasts_Consentflow_Deletedcredentials2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Se eliminaron ${i?.count} credenciales del contrato ${i?.name}`)
};

const fr_toasts_consentflow_deletedcredentials2 = /** @type {(inputs: Toasts_Consentflow_Deletedcredentials2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.count} accréditations supprimées du contrat ${i?.name}`)
};

const ar_toasts_consentflow_deletedcredentials2 = /** @type {(inputs: Toasts_Consentflow_Deletedcredentials2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تم حذف ${i?.count} بيانات اعتماد من العقد ${i?.name}`)
};

/**
* | output |
* | --- |
* | "Deleted {count} credentials from contract {name}" |
*
* @param {Toasts_Consentflow_Deletedcredentials2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_consentflow_deletedcredentials2 = /** @type {((inputs: Toasts_Consentflow_Deletedcredentials2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Consentflow_Deletedcredentials2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_consentflow_deletedcredentials2(inputs)
	if (locale === "es") return es_toasts_consentflow_deletedcredentials2(inputs)
	if (locale === "fr") return fr_toasts_consentflow_deletedcredentials2(inputs)
	return ar_toasts_consentflow_deletedcredentials2(inputs)
});
export { toasts_consentflow_deletedcredentials2 as "toasts.consentFlow.deletedCredentials" }