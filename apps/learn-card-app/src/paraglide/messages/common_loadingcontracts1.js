/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Loadingcontracts1Inputs */

const en_common_loadingcontracts1 = /** @type {(inputs: Common_Loadingcontracts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading Contracts...`)
};

const es_common_loadingcontracts1 = /** @type {(inputs: Common_Loadingcontracts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando contratos...`)
};

const fr_common_loadingcontracts1 = /** @type {(inputs: Common_Loadingcontracts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des contrats...`)
};

const ar_common_loadingcontracts1 = /** @type {(inputs: Common_Loadingcontracts1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل العقود...`)
};

/**
* | output |
* | --- |
* | "Loading Contracts..." |
*
* @param {Common_Loadingcontracts1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_loadingcontracts1 = /** @type {((inputs?: Common_Loadingcontracts1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Loadingcontracts1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_loadingcontracts1(inputs)
	if (locale === "es") return es_common_loadingcontracts1(inputs)
	if (locale === "fr") return fr_common_loadingcontracts1(inputs)
	return ar_common_loadingcontracts1(inputs)
});
export { common_loadingcontracts1 as "common.loadingContracts" }