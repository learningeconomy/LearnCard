/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Networkverified2Inputs */

const en_credsbundle_networkverified2 = /** @type {(inputs: Credsbundle_Networkverified2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verified by the LearnCard Network`)
};

const es_credsbundle_networkverified2 = /** @type {(inputs: Credsbundle_Networkverified2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verificado por la Red LearnCard`)
};

const fr_credsbundle_networkverified2 = /** @type {(inputs: Credsbundle_Networkverified2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vérifié par le réseau LearnCard`)
};

const ar_credsbundle_networkverified2 = /** @type {(inputs: Credsbundle_Networkverified2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verified by the LearnCard Network`)
};

/**
* | output |
* | --- |
* | "Verified by the LearnCard Network" |
*
* @param {Credsbundle_Networkverified2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_networkverified2 = /** @type {((inputs?: Credsbundle_Networkverified2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Networkverified2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_networkverified2(inputs)
	if (locale === "es") return es_credsbundle_networkverified2(inputs)
	if (locale === "fr") return fr_credsbundle_networkverified2(inputs)
	return ar_credsbundle_networkverified2(inputs)
});
export { credsbundle_networkverified2 as "credsBundle.networkVerified" }