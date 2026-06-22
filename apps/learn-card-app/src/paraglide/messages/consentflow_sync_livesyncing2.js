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

const fr_consentflow_sync_livesyncing2 = /** @type {(inputs: Consentflow_Sync_Livesyncing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Synchronisation en direct`)
};

const ar_consentflow_sync_livesyncing2 = /** @type {(inputs: Consentflow_Sync_Livesyncing2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مزامنة مباشرة`)
};

/**
* | output |
* | --- |
* | "Live Syncing" |
*
* @param {Consentflow_Sync_Livesyncing2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_sync_livesyncing2 = /** @type {((inputs?: Consentflow_Sync_Livesyncing2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Sync_Livesyncing2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_sync_livesyncing2(inputs)
	if (locale === "es") return es_consentflow_sync_livesyncing2(inputs)
	if (locale === "fr") return fr_consentflow_sync_livesyncing2(inputs)
	return ar_consentflow_sync_livesyncing2(inputs)
});
export { consentflow_sync_livesyncing2 as "consentFlow.sync.liveSyncing" }