/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Discovery_Keywordplaceholder2Inputs */

const en_aipathways_discovery_keywordplaceholder2 = /** @type {(inputs: Aipathways_Discovery_Keywordplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`e.g. Software Engineer`)
};

const es_aipathways_discovery_keywordplaceholder2 = /** @type {(inputs: Aipathways_Discovery_Keywordplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`p. ej. Ingeniero de software`)
};

const fr_aipathways_discovery_keywordplaceholder2 = /** @type {(inputs: Aipathways_Discovery_Keywordplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`p. ex. Ingénieur logiciel`)
};

const ar_aipathways_discovery_keywordplaceholder2 = /** @type {(inputs: Aipathways_Discovery_Keywordplaceholder2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مثال: مهندس برمجيات`)
};

/**
* | output |
* | --- |
* | "e.g. Software Engineer" |
*
* @param {Aipathways_Discovery_Keywordplaceholder2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_discovery_keywordplaceholder2 = /** @type {((inputs?: Aipathways_Discovery_Keywordplaceholder2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Discovery_Keywordplaceholder2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_discovery_keywordplaceholder2(inputs)
	if (locale === "es") return es_aipathways_discovery_keywordplaceholder2(inputs)
	if (locale === "fr") return fr_aipathways_discovery_keywordplaceholder2(inputs)
	return ar_aipathways_discovery_keywordplaceholder2(inputs)
});
export { aipathways_discovery_keywordplaceholder2 as "aiPathways.discovery.keywordPlaceholder" }