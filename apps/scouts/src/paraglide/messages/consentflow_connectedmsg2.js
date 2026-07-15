/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Connectedmsg2Inputs */

const en_consentflow_connectedmsg2 = /** @type {(inputs: Consentflow_Connectedmsg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You are now connected with {name}!`)
};

const es_consentflow_connectedmsg2 = /** @type {(inputs: Consentflow_Connectedmsg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Ahora estás conectado con {name}!`)
};

const fr_consentflow_connectedmsg2 = /** @type {(inputs: Consentflow_Connectedmsg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous êtes maintenant connecté avec {name} !`)
};

const ar_consentflow_connectedmsg2 = /** @type {(inputs: Consentflow_Connectedmsg2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`أنت متصل الآن مع {name}!`)
};

/**
* | output |
* | --- |
* | "You are now connected with {name}!" |
*
* @param {Consentflow_Connectedmsg2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_connectedmsg2 = /** @type {((inputs?: Consentflow_Connectedmsg2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Connectedmsg2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_connectedmsg2(inputs)
	if (locale === "es") return es_consentflow_connectedmsg2(inputs)
	if (locale === "fr") return fr_consentflow_connectedmsg2(inputs)
	return ar_consentflow_connectedmsg2(inputs)
});
export { consentflow_connectedmsg2 as "consentFlow.connectedMsg" }