/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Nextcredential2Inputs */

const en_aipathways_nextcredential2 = /** @type {(inputs: Aipathways_Nextcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Next credential`)
};

const es_aipathways_nextcredential2 = /** @type {(inputs: Aipathways_Nextcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Siguiente credencial`)
};

const fr_aipathways_nextcredential2 = /** @type {(inputs: Aipathways_Nextcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certificat suivant`)
};

const ar_aipathways_nextcredential2 = /** @type {(inputs: Aipathways_Nextcredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشهادة التالية`)
};

/**
* | output |
* | --- |
* | "Next credential" |
*
* @param {Aipathways_Nextcredential2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_nextcredential2 = /** @type {((inputs?: Aipathways_Nextcredential2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Nextcredential2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_nextcredential2(inputs)
	if (locale === "es") return es_aipathways_nextcredential2(inputs)
	if (locale === "fr") return fr_aipathways_nextcredential2(inputs)
	return ar_aipathways_nextcredential2(inputs)
});
export { aipathways_nextcredential2 as "aiPathways.nextCredential" }