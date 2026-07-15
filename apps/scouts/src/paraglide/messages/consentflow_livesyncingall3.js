/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Livesyncingall3Inputs */

const en_consentflow_livesyncingall3 = /** @type {(inputs: Consentflow_Livesyncingall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Live Syncing All`)
};

const es_consentflow_livesyncingall3 = /** @type {(inputs: Consentflow_Livesyncingall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sincronizando Todo en Vivo`)
};

const fr_consentflow_livesyncingall3 = /** @type {(inputs: Consentflow_Livesyncingall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Synchronisation en direct totale`)
};

const ar_consentflow_livesyncingall3 = /** @type {(inputs: Consentflow_Livesyncingall3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Live Syncing All`)
};

/**
* | output |
* | --- |
* | "Live Syncing All" |
*
* @param {Consentflow_Livesyncingall3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_livesyncingall3 = /** @type {((inputs?: Consentflow_Livesyncingall3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Livesyncingall3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_livesyncingall3(inputs)
	if (locale === "es") return es_consentflow_livesyncingall3(inputs)
	if (locale === "fr") return fr_consentflow_livesyncingall3(inputs)
	return ar_consentflow_livesyncingall3(inputs)
});
export { consentflow_livesyncingall3 as "consentFlow.liveSyncingAll" }