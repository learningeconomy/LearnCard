/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Aboutchapi2Inputs */

const en_credsbundle_aboutchapi2 = /** @type {(inputs: Credsbundle_Aboutchapi2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`About Chapi`)
};

const es_credsbundle_aboutchapi2 = /** @type {(inputs: Credsbundle_Aboutchapi2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Acerca de Chapi`)
};

const fr_credsbundle_aboutchapi2 = /** @type {(inputs: Credsbundle_Aboutchapi2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`À propos de CHAPI`)
};

const ar_credsbundle_aboutchapi2 = /** @type {(inputs: Credsbundle_Aboutchapi2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`About Chapi`)
};

/**
* | output |
* | --- |
* | "About Chapi" |
*
* @param {Credsbundle_Aboutchapi2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_aboutchapi2 = /** @type {((inputs?: Credsbundle_Aboutchapi2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Aboutchapi2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_aboutchapi2(inputs)
	if (locale === "es") return es_credsbundle_aboutchapi2(inputs)
	if (locale === "fr") return fr_credsbundle_aboutchapi2(inputs)
	return ar_credsbundle_aboutchapi2(inputs)
});
export { credsbundle_aboutchapi2 as "credsBundle.aboutChapi" }