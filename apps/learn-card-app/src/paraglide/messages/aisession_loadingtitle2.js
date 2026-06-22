/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aisession_Loadingtitle2Inputs */

const en_aisession_loadingtitle2 = /** @type {(inputs: Aisession_Loadingtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading title`)
};

const es_aisession_loadingtitle2 = /** @type {(inputs: Aisession_Loadingtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando título`)
};

const fr_aisession_loadingtitle2 = /** @type {(inputs: Aisession_Loadingtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement du titre`)
};

const ar_aisession_loadingtitle2 = /** @type {(inputs: Aisession_Loadingtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحميل العنوان`)
};

/**
* | output |
* | --- |
* | "Loading title" |
*
* @param {Aisession_Loadingtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aisession_loadingtitle2 = /** @type {((inputs?: Aisession_Loadingtitle2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aisession_Loadingtitle2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aisession_loadingtitle2(inputs)
	if (locale === "es") return es_aisession_loadingtitle2(inputs)
	if (locale === "fr") return fr_aisession_loadingtitle2(inputs)
	return ar_aisession_loadingtitle2(inputs)
});
export { aisession_loadingtitle2 as "aiSession.loadingTitle" }