/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Disconnect1Inputs */

const en_consentflow_disconnect1 = /** @type {(inputs: Consentflow_Disconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Disconnect`)
};

const es_consentflow_disconnect1 = /** @type {(inputs: Consentflow_Disconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desconectar`)
};

const fr_consentflow_disconnect1 = /** @type {(inputs: Consentflow_Disconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déconnecter`)
};

const ar_consentflow_disconnect1 = /** @type {(inputs: Consentflow_Disconnect1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Disconnect`)
};

/**
* | output |
* | --- |
* | "Disconnect" |
*
* @param {Consentflow_Disconnect1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_disconnect1 = /** @type {((inputs?: Consentflow_Disconnect1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Disconnect1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_disconnect1(inputs)
	if (locale === "es") return es_consentflow_disconnect1(inputs)
	if (locale === "fr") return fr_consentflow_disconnect1(inputs)
	return ar_consentflow_disconnect1(inputs)
});
export { consentflow_disconnect1 as "consentFlow.disconnect" }