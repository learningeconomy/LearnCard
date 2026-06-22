/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Exploreroles2Inputs */

const en_aipathways_exploreroles2 = /** @type {(inputs: Aipathways_Exploreroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explore Roles`)
};

const es_aipathways_exploreroles2 = /** @type {(inputs: Aipathways_Exploreroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar roles`)
};

const fr_aipathways_exploreroles2 = /** @type {(inputs: Aipathways_Exploreroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorer les rôles`)
};

const ar_aipathways_exploreroles2 = /** @type {(inputs: Aipathways_Exploreroles2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`استكشاف الأدوار`)
};

/**
* | output |
* | --- |
* | "Explore Roles" |
*
* @param {Aipathways_Exploreroles2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_exploreroles2 = /** @type {((inputs?: Aipathways_Exploreroles2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Exploreroles2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_exploreroles2(inputs)
	if (locale === "es") return es_aipathways_exploreroles2(inputs)
	if (locale === "fr") return fr_aipathways_exploreroles2(inputs)
	return ar_aipathways_exploreroles2(inputs)
});
export { aipathways_exploreroles2 as "aiPathways.exploreRoles" }