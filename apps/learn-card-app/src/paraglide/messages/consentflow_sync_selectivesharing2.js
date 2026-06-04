/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Sync_Selectivesharing2Inputs */

const en_consentflow_sync_selectivesharing2 = /** @type {(inputs: Consentflow_Sync_Selectivesharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selective Sharing`)
};

const es_consentflow_sync_selectivesharing2 = /** @type {(inputs: Consentflow_Sync_Selectivesharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir selectivo`)
};

const de_consentflow_sync_selectivesharing2 = /** @type {(inputs: Consentflow_Sync_Selectivesharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Selektives Teilen`)
};

const ar_consentflow_sync_selectivesharing2 = /** @type {(inputs: Consentflow_Sync_Selectivesharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة انتقائية`)
};

const fr_consentflow_sync_selectivesharing2 = /** @type {(inputs: Consentflow_Sync_Selectivesharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partage sélectif`)
};

const ko_consentflow_sync_selectivesharing2 = /** @type {(inputs: Consentflow_Sync_Selectivesharing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`선택적 공유`)
};

/**
* | output |
* | --- |
* | "Selective Sharing" |
*
* @param {Consentflow_Sync_Selectivesharing2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_sync_selectivesharing2 = /** @type {((inputs?: Consentflow_Sync_Selectivesharing2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Sync_Selectivesharing2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_sync_selectivesharing2(inputs)
	if (locale === "es") return es_consentflow_sync_selectivesharing2(inputs)
	if (locale === "de") return de_consentflow_sync_selectivesharing2(inputs)
	if (locale === "ar") return ar_consentflow_sync_selectivesharing2(inputs)
	if (locale === "fr") return fr_consentflow_sync_selectivesharing2(inputs)
	return ko_consentflow_sync_selectivesharing2(inputs)
});
export { consentflow_sync_selectivesharing2 as "consentFlow.sync.selectiveSharing" }