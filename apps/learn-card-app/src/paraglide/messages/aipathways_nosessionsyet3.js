/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Nosessionsyet3Inputs */

const en_aipathways_nosessionsyet3 = /** @type {(inputs: Aipathways_Nosessionsyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No sessions yet`)
};

const es_aipathways_nosessionsyet3 = /** @type {(inputs: Aipathways_Nosessionsyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay sesiones`)
};

const fr_aipathways_nosessionsyet3 = /** @type {(inputs: Aipathways_Nosessionsyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Pas encore de sessions`)
};

const ar_aipathways_nosessionsyet3 = /** @type {(inputs: Aipathways_Nosessionsyet3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد جلسات بعد`)
};

/**
* | output |
* | --- |
* | "No sessions yet" |
*
* @param {Aipathways_Nosessionsyet3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_nosessionsyet3 = /** @type {((inputs?: Aipathways_Nosessionsyet3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Nosessionsyet3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_nosessionsyet3(inputs)
	if (locale === "es") return es_aipathways_nosessionsyet3(inputs)
	if (locale === "fr") return fr_aipathways_nosessionsyet3(inputs)
	return ar_aipathways_nosessionsyet3(inputs)
});
export { aipathways_nosessionsyet3 as "aiPathways.noSessionsYet" }