/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Sharing1Inputs */

const en_credsbundle_sharing1 = /** @type {(inputs: Credsbundle_Sharing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sharing...`)
};

const es_credsbundle_sharing1 = /** @type {(inputs: Credsbundle_Sharing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartiendo...`)
};

const fr_credsbundle_sharing1 = /** @type {(inputs: Credsbundle_Sharing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partage en cours...`)
};

const ar_credsbundle_sharing1 = /** @type {(inputs: Credsbundle_Sharing1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري المشاركة...`)
};

/**
* | output |
* | --- |
* | "Sharing..." |
*
* @param {Credsbundle_Sharing1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_sharing1 = /** @type {((inputs?: Credsbundle_Sharing1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Sharing1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_sharing1(inputs)
	if (locale === "es") return es_credsbundle_sharing1(inputs)
	if (locale === "fr") return fr_credsbundle_sharing1(inputs)
	return ar_credsbundle_sharing1(inputs)
});
export { credsbundle_sharing1 as "credsBundle.sharing" }