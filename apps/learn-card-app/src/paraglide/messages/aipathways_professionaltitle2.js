/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Professionaltitle2Inputs */

const en_aipathways_professionaltitle2 = /** @type {(inputs: Aipathways_Professionaltitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Professional title...`)
};

const es_aipathways_professionaltitle2 = /** @type {(inputs: Aipathways_Professionaltitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Título profesional...`)
};

const fr_aipathways_professionaltitle2 = /** @type {(inputs: Aipathways_Professionaltitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Titre professionnel...`)
};

const ar_aipathways_professionaltitle2 = /** @type {(inputs: Aipathways_Professionaltitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...المسمى المهني`)
};

/**
* | output |
* | --- |
* | "Professional title..." |
*
* @param {Aipathways_Professionaltitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_professionaltitle2 = /** @type {((inputs?: Aipathways_Professionaltitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Professionaltitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_professionaltitle2(inputs)
	if (locale === "es") return es_aipathways_professionaltitle2(inputs)
	if (locale === "fr") return fr_aipathways_professionaltitle2(inputs)
	return ar_aipathways_professionaltitle2(inputs)
});
export { aipathways_professionaltitle2 as "aiPathways.professionalTitle" }