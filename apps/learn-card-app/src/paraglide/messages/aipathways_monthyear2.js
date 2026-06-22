/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aipathways_Monthyear2Inputs */

const en_aipathways_monthyear2 = /** @type {(inputs: Aipathways_Monthyear2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Month, Year`)
};

const es_aipathways_monthyear2 = /** @type {(inputs: Aipathways_Monthyear2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mes, Año`)
};

const fr_aipathways_monthyear2 = /** @type {(inputs: Aipathways_Monthyear2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mois, Année`)
};

const ar_aipathways_monthyear2 = /** @type {(inputs: Aipathways_Monthyear2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الشهر، السنة`)
};

/**
* | output |
* | --- |
* | "Month, Year" |
*
* @param {Aipathways_Monthyear2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aipathways_monthyear2 = /** @type {((inputs?: Aipathways_Monthyear2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aipathways_Monthyear2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aipathways_monthyear2(inputs)
	if (locale === "es") return es_aipathways_monthyear2(inputs)
	if (locale === "fr") return fr_aipathways_monthyear2(inputs)
	return ar_aipathways_monthyear2(inputs)
});
export { aipathways_monthyear2 as "aiPathways.monthYear" }