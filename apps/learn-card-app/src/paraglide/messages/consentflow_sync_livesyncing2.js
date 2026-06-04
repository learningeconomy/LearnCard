/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Sync_Livesyncing2Inputs */

const en_consentflow_sync_livesyncing2 = /** @type {(inputs: Consentflow_Sync_Livesyncing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Live Syncing`)
};

const es_consentflow_sync_livesyncing2 = /** @type {(inputs: Consentflow_Sync_Livesyncing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sincronización en vivo`)
};

const de_consentflow_sync_livesyncing2 = /** @type {(inputs: Consentflow_Sync_Livesyncing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Live-Synchronisierung`)
};

const ar_consentflow_sync_livesyncing2 = /** @type {(inputs: Consentflow_Sync_Livesyncing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مزامنة مباشرة`)
};

const fr_consentflow_sync_livesyncing2 = /** @type {(inputs: Consentflow_Sync_Livesyncing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Synchronisation en direct`)
};

const ko_consentflow_sync_livesyncing2 = /** @type {(inputs: Consentflow_Sync_Livesyncing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`실시간 동기화`)
};

/**
* | output |
* | --- |
* | "Live Syncing" |
*
* @param {Consentflow_Sync_Livesyncing2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const consentflow_sync_livesyncing2 = /** @type {((inputs?: Consentflow_Sync_Livesyncing2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Sync_Livesyncing2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_sync_livesyncing2(inputs)
	if (locale === "es") return es_consentflow_sync_livesyncing2(inputs)
	if (locale === "de") return de_consentflow_sync_livesyncing2(inputs)
	if (locale === "ar") return ar_consentflow_sync_livesyncing2(inputs)
	if (locale === "fr") return fr_consentflow_sync_livesyncing2(inputs)
	return ko_consentflow_sync_livesyncing2(inputs)
});
export { consentflow_sync_livesyncing2 as "consentFlow.sync.liveSyncing" }