/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Consentflow_Willdisconnect2Inputs */

const en_consentflow_willdisconnect2 = /** @type {(inputs: Consentflow_Willdisconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`You will be disconnected from this contract`)
};

const es_consentflow_willdisconnect2 = /** @type {(inputs: Consentflow_Willdisconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Serás desconectado de este contrato`)
};

const fr_consentflow_willdisconnect2 = /** @type {(inputs: Consentflow_Willdisconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous serez déconnecté de ce contrat`)
};

const ar_consentflow_willdisconnect2 = /** @type {(inputs: Consentflow_Willdisconnect2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`سيتم قطع اتصالك من هذا العقد`)
};

/**
* | output |
* | --- |
* | "You will be disconnected from this contract" |
*
* @param {Consentflow_Willdisconnect2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const consentflow_willdisconnect2 = /** @type {((inputs?: Consentflow_Willdisconnect2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Consentflow_Willdisconnect2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_consentflow_willdisconnect2(inputs)
	if (locale === "es") return es_consentflow_willdisconnect2(inputs)
	if (locale === "fr") return fr_consentflow_willdisconnect2(inputs)
	return ar_consentflow_willdisconnect2(inputs)
});
export { consentflow_willdisconnect2 as "consentFlow.willDisconnect" }