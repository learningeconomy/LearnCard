/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Receivedcredential2Inputs */

const en_consentflow_receivedcredential2 = /** @type {(inputs: Consentflow_Receivedcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You have received a credential.`)
};

const es_consentflow_receivedcredential2 = /** @type {(inputs: Consentflow_Receivedcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Has recibido una credencial.`)
};

const fr_consentflow_receivedcredential2 = /** @type {(inputs: Consentflow_Receivedcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous avez reçu un titre.`)
};

const ar_consentflow_receivedcredential2 = /** @type {(inputs: Consentflow_Receivedcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لقد تلقيت بيانات اعتماد.`)
};

/**
* | output |
* | --- |
* | "You have received a credential." |
*
* @param {Consentflow_Receivedcredential2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_receivedcredential2 = /** @type {((inputs?: Consentflow_Receivedcredential2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Receivedcredential2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_receivedcredential2(inputs)
	if (locale === "es") return es_consentflow_receivedcredential2(inputs)
	if (locale === "fr") return fr_consentflow_receivedcredential2(inputs)
	return ar_consentflow_receivedcredential2(inputs)
});
export { consentflow_receivedcredential2 as "consentFlow.receivedCredential" }