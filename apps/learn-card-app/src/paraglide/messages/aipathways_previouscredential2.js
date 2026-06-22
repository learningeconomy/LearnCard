/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Previouscredential2Inputs */

const en_aipathways_previouscredential2 = /** @type {(inputs: Aipathways_Previouscredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Previous credential`)
};

const es_aipathways_previouscredential2 = /** @type {(inputs: Aipathways_Previouscredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Credencial anterior`)
};

const fr_aipathways_previouscredential2 = /** @type {(inputs: Aipathways_Previouscredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Certificat précédent`)
};

const ar_aipathways_previouscredential2 = /** @type {(inputs: Aipathways_Previouscredential2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشهادة السابقة`)
};

/**
* | output |
* | --- |
* | "Previous credential" |
*
* @param {Aipathways_Previouscredential2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_previouscredential2 = /** @type {((inputs?: Aipathways_Previouscredential2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Previouscredential2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_previouscredential2(inputs)
	if (locale === "es") return es_aipathways_previouscredential2(inputs)
	if (locale === "fr") return fr_aipathways_previouscredential2(inputs)
	return ar_aipathways_previouscredential2(inputs)
});
export { aipathways_previouscredential2 as "aiPathways.previousCredential" }