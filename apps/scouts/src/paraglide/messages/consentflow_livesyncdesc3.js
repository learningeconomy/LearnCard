/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Livesyncdesc3Inputs */

const en_consentflow_livesyncdesc3 = /** @type {(inputs: Consentflow_Livesyncdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Turning on live syncing will continuosly share your credentials as you get them. This can be enabled/disabled per category at any time.`)
};

const es_consentflow_livesyncdesc3 = /** @type {(inputs: Consentflow_Livesyncdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Activar la sincronización en vivo compartirá continuamente tus credenciales a medida que las obtengas.`)
};

const fr_consentflow_livesyncdesc3 = /** @type {(inputs: Consentflow_Livesyncdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'activation de la synchronisation en direct partagera vos justificatifs en continu au fur et à mesure que vous les recevez. Cela peut être activé/désactivé par catégorie à tout moment.`)
};

const ar_consentflow_livesyncdesc3 = /** @type {(inputs: Consentflow_Livesyncdesc3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Turning on live syncing will continuosly share your credentials as you get them. This can be enabled/disabled per category at any time.`)
};

/**
* | output |
* | --- |
* | "Turning on live syncing will continuosly share your credentials as you get them. This can be enabled/disabled per category at any time." |
*
* @param {Consentflow_Livesyncdesc3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_livesyncdesc3 = /** @type {((inputs?: Consentflow_Livesyncdesc3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Livesyncdesc3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_livesyncdesc3(inputs)
	if (locale === "es") return es_consentflow_livesyncdesc3(inputs)
	if (locale === "fr") return fr_consentflow_livesyncdesc3(inputs)
	return ar_consentflow_livesyncdesc3(inputs)
});
export { consentflow_livesyncdesc3 as "consentFlow.liveSyncDesc" }