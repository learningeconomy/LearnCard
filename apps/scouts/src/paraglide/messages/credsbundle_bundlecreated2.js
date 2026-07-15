/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Credsbundle_Bundlecreated2Inputs */

const en_credsbundle_bundlecreated2 = /** @type {(inputs: Credsbundle_Bundlecreated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost bundle created`)
};

const es_credsbundle_bundlecreated2 = /** @type {(inputs: Credsbundle_Bundlecreated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Paquete de Boost creado`)
};

const fr_credsbundle_bundlecreated2 = /** @type {(inputs: Credsbundle_Bundlecreated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ensemble de Boosts créé`)
};

const ar_credsbundle_bundlecreated2 = /** @type {(inputs: Credsbundle_Bundlecreated2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Boost bundle created`)
};

/**
* | output |
* | --- |
* | "Boost bundle created" |
*
* @param {Credsbundle_Bundlecreated2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const credsbundle_bundlecreated2 = /** @type {((inputs?: Credsbundle_Bundlecreated2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Credsbundle_Bundlecreated2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_credsbundle_bundlecreated2(inputs)
	if (locale === "es") return es_credsbundle_bundlecreated2(inputs)
	if (locale === "fr") return fr_credsbundle_bundlecreated2(inputs)
	return ar_credsbundle_bundlecreated2(inputs)
});
export { credsbundle_bundlecreated2 as "credsBundle.bundleCreated" }