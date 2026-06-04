/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ name: NonNullable<unknown>, error: NonNullable<unknown> }} Toasts_Consentflow_Deleteerror2Inputs */

const en_toasts_consentflow_deleteerror2 = /** @type {(inputs: Toasts_Consentflow_Deleteerror2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error while deleting credentials from contract ${i?.name}: ${i?.error}`)
};

const es_toasts_consentflow_deleteerror2 = /** @type {(inputs: Toasts_Consentflow_Deleteerror2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Error al eliminar credenciales del contrato ${i?.name}: ${i?.error}`)
};

const de_toasts_consentflow_deleteerror2 = /** @type {(inputs: Toasts_Consentflow_Deleteerror2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Fehler beim Löschen von Berechtigungen aus Vertrag ${i?.name}: ${i?.error}`)
};

const ar_toasts_consentflow_deleteerror2 = /** @type {(inputs: Toasts_Consentflow_Deleteerror2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`خطأ أثناء حذف بيانات الاعتماد من العقد ${i?.name}: ${i?.error}`)
};

const fr_toasts_consentflow_deleteerror2 = /** @type {(inputs: Toasts_Consentflow_Deleteerror2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Erreur lors de la suppression des accréditations du contrat ${i?.name} : ${i?.error}`)
};

const ko_toasts_consentflow_deleteerror2 = /** @type {(inputs: Toasts_Consentflow_Deleteerror2Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`계약 ${i?.name}에서 자격 증명 삭제 중 오류: ${i?.error}`)
};

/**
* | output |
* | --- |
* | "Error while deleting credentials from contract {name}: {error}" |
*
* @param {Toasts_Consentflow_Deleteerror2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_consentflow_deleteerror2 = /** @type {((inputs: Toasts_Consentflow_Deleteerror2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Consentflow_Deleteerror2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_consentflow_deleteerror2(inputs)
	if (locale === "es") return es_toasts_consentflow_deleteerror2(inputs)
	if (locale === "de") return de_toasts_consentflow_deleteerror2(inputs)
	if (locale === "ar") return ar_toasts_consentflow_deleteerror2(inputs)
	if (locale === "fr") return fr_toasts_consentflow_deleteerror2(inputs)
	return ko_toasts_consentflow_deleteerror2(inputs)
});
export { toasts_consentflow_deleteerror2 as "toasts.consentFlow.deleteError" }