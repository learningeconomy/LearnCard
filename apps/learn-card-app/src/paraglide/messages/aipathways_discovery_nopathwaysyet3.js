/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Discovery_Nopathwaysyet3Inputs */

const en_aipathways_discovery_nopathwaysyet3 = /** @type {(inputs: Aipathways_Discovery_Nopathwaysyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No Pathways yet.`)
};

const es_aipathways_discovery_nopathwaysyet3 = /** @type {(inputs: Aipathways_Discovery_Nopathwaysyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay Pathways.`)
};

const fr_aipathways_discovery_nopathwaysyet3 = /** @type {(inputs: Aipathways_Discovery_Nopathwaysyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun Pathways pour le moment.`)
};

const ar_aipathways_discovery_nopathwaysyet3 = /** @type {(inputs: Aipathways_Discovery_Nopathwaysyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد مسارات بعد.`)
};

/**
* | output |
* | --- |
* | "No Pathways yet." |
*
* @param {Aipathways_Discovery_Nopathwaysyet3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_discovery_nopathwaysyet3 = /** @type {((inputs?: Aipathways_Discovery_Nopathwaysyet3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Discovery_Nopathwaysyet3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_discovery_nopathwaysyet3(inputs)
	if (locale === "es") return es_aipathways_discovery_nopathwaysyet3(inputs)
	if (locale === "fr") return fr_aipathways_discovery_nopathwaysyet3(inputs)
	return ar_aipathways_discovery_nopathwaysyet3(inputs)
});
export { aipathways_discovery_nopathwaysyet3 as "aiPathways.discovery.noPathwaysYet" }