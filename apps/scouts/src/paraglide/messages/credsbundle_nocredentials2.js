/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Nocredentials2Inputs */

const en_credsbundle_nocredentials2 = /** @type {(inputs: Credsbundle_Nocredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Credentials`)
};

const es_credsbundle_nocredentials2 = /** @type {(inputs: Credsbundle_Nocredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sin Credenciales`)
};

const fr_credsbundle_nocredentials2 = /** @type {(inputs: Credsbundle_Nocredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun justificatif`)
};

const ar_credsbundle_nocredentials2 = /** @type {(inputs: Credsbundle_Nocredentials2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد مؤهلات`)
};

/**
* | output |
* | --- |
* | "No Credentials" |
*
* @param {Credsbundle_Nocredentials2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_nocredentials2 = /** @type {((inputs?: Credsbundle_Nocredentials2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Nocredentials2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_nocredentials2(inputs)
	if (locale === "es") return es_credsbundle_nocredentials2(inputs)
	if (locale === "fr") return fr_credsbundle_nocredentials2(inputs)
	return ar_credsbundle_nocredentials2(inputs)
});
export { credsbundle_nocredentials2 as "credsBundle.noCredentials" }