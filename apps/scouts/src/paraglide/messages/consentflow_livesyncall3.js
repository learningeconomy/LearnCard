/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Livesyncall3Inputs */

const en_consentflow_livesyncall3 = /** @type {(inputs: Consentflow_Livesyncall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Live Sync All`)
};

const es_consentflow_livesyncall3 = /** @type {(inputs: Consentflow_Livesyncall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sincronización en Vivo Total`)
};

const fr_consentflow_livesyncall3 = /** @type {(inputs: Consentflow_Livesyncall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Synchronisation en direct totale`)
};

const ar_consentflow_livesyncall3 = /** @type {(inputs: Consentflow_Livesyncall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Live Sync All`)
};

/**
* | output |
* | --- |
* | "Live Sync All" |
*
* @param {Consentflow_Livesyncall3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_livesyncall3 = /** @type {((inputs?: Consentflow_Livesyncall3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Livesyncall3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_livesyncall3(inputs)
	if (locale === "es") return es_consentflow_livesyncall3(inputs)
	if (locale === "fr") return fr_consentflow_livesyncall3(inputs)
	return ar_consentflow_livesyncall3(inputs)
});
export { consentflow_livesyncall3 as "consentFlow.liveSyncAll" }