/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Credstatus2Inputs */

const en_credsbundle_credstatus2 = /** @type {(inputs: Credsbundle_Credstatus2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Status:`)
};

const es_credsbundle_credstatus2 = /** @type {(inputs: Credsbundle_Credstatus2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estado de la Credencial:`)
};

const fr_credsbundle_credstatus2 = /** @type {(inputs: Credsbundle_Credstatus2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Statut du justificatif :`)
};

const ar_credsbundle_credstatus2 = /** @type {(inputs: Credsbundle_Credstatus2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credential Status:`)
};

/**
* | output |
* | --- |
* | "Credential Status:" |
*
* @param {Credsbundle_Credstatus2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_credstatus2 = /** @type {((inputs?: Credsbundle_Credstatus2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Credstatus2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_credstatus2(inputs)
	if (locale === "es") return es_credsbundle_credstatus2(inputs)
	if (locale === "fr") return fr_credsbundle_credstatus2(inputs)
	return ar_credsbundle_credstatus2(inputs)
});
export { credsbundle_credstatus2 as "credsBundle.credStatus" }