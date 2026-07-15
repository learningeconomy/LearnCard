/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Abouttitle2Inputs */

const en_credsbundle_abouttitle2 = /** @type {(inputs: Credsbundle_Abouttitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`About {title}`)
};

const es_credsbundle_abouttitle2 = /** @type {(inputs: Credsbundle_Abouttitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acerca de {title}`)
};

const fr_credsbundle_abouttitle2 = /** @type {(inputs: Credsbundle_Abouttitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`À propos de {title}`)
};

const ar_credsbundle_abouttitle2 = /** @type {(inputs: Credsbundle_Abouttitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حول {title}`)
};

/**
* | output |
* | --- |
* | "About {title}" |
*
* @param {Credsbundle_Abouttitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_abouttitle2 = /** @type {((inputs?: Credsbundle_Abouttitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Abouttitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_abouttitle2(inputs)
	if (locale === "es") return es_credsbundle_abouttitle2(inputs)
	if (locale === "fr") return fr_credsbundle_abouttitle2(inputs)
	return ar_credsbundle_abouttitle2(inputs)
});
export { credsbundle_abouttitle2 as "credsBundle.aboutTitle" }