/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Getscoutpass3Inputs */

const en_credsbundle_getscoutpass3 = /** @type {(inputs: Credsbundle_Getscoutpass3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get ScoutPass`)
};

const es_credsbundle_getscoutpass3 = /** @type {(inputs: Credsbundle_Getscoutpass3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtener ScoutPass`)
};

const fr_credsbundle_getscoutpass3 = /** @type {(inputs: Credsbundle_Getscoutpass3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Obtenir ScoutPass`)
};

const ar_credsbundle_getscoutpass3 = /** @type {(inputs: Credsbundle_Getscoutpass3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Get ScoutPass`)
};

/**
* | output |
* | --- |
* | "Get ScoutPass" |
*
* @param {Credsbundle_Getscoutpass3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_getscoutpass3 = /** @type {((inputs?: Credsbundle_Getscoutpass3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Getscoutpass3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_getscoutpass3(inputs)
	if (locale === "es") return es_credsbundle_getscoutpass3(inputs)
	if (locale === "fr") return fr_credsbundle_getscoutpass3(inputs)
	return ar_credsbundle_getscoutpass3(inputs)
});
export { credsbundle_getscoutpass3 as "credsBundle.getScoutPass" }