/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Copylink2Inputs */

const en_credsbundle_copylink2 = /** @type {(inputs: Credsbundle_Copylink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy link`)
};

const es_credsbundle_copylink2 = /** @type {(inputs: Credsbundle_Copylink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copiar enlace`)
};

const fr_credsbundle_copylink2 = /** @type {(inputs: Credsbundle_Copylink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier le lien`)
};

const ar_credsbundle_copylink2 = /** @type {(inputs: Credsbundle_Copylink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copy link`)
};

/**
* | output |
* | --- |
* | "Copy link" |
*
* @param {Credsbundle_Copylink2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_copylink2 = /** @type {((inputs?: Credsbundle_Copylink2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Copylink2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_copylink2(inputs)
	if (locale === "es") return es_credsbundle_copylink2(inputs)
	if (locale === "fr") return fr_credsbundle_copylink2(inputs)
	return ar_credsbundle_copylink2(inputs)
});
export { credsbundle_copylink2 as "credsBundle.copyLink" }