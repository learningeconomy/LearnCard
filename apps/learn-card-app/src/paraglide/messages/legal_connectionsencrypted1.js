/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Legal_Connectionsencrypted1Inputs */

const en_legal_connectionsencrypted1 = /** @type {(inputs: Legal_Connectionsencrypted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All connections are encrypted.`)
};

const es_legal_connectionsencrypted1 = /** @type {(inputs: Legal_Connectionsencrypted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todas las conexiones están cifradas.`)
};

const fr_legal_connectionsencrypted1 = /** @type {(inputs: Legal_Connectionsencrypted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Toutes les connexions sont chiffrées.`)
};

const ar_legal_connectionsencrypted1 = /** @type {(inputs: Legal_Connectionsencrypted1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جميع الاتصالات مشفّرة.`)
};

/**
* | output |
* | --- |
* | "All connections are encrypted." |
*
* @param {Legal_Connectionsencrypted1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const legal_connectionsencrypted1 = /** @type {((inputs?: Legal_Connectionsencrypted1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Legal_Connectionsencrypted1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_legal_connectionsencrypted1(inputs)
	if (locale === "es") return es_legal_connectionsencrypted1(inputs)
	if (locale === "fr") return fr_legal_connectionsencrypted1(inputs)
	return ar_legal_connectionsencrypted1(inputs)
});
export { legal_connectionsencrypted1 as "legal.connectionsEncrypted" }