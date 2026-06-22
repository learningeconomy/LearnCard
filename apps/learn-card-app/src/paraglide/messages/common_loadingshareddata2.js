/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Loadingshareddata2Inputs */

const en_common_loadingshareddata2 = /** @type {(inputs: Common_Loadingshareddata2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading shared data…`)
};

const es_common_loadingshareddata2 = /** @type {(inputs: Common_Loadingshareddata2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando datos compartidos…`)
};

const fr_common_loadingshareddata2 = /** @type {(inputs: Common_Loadingshareddata2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement des données partagées…`)
};

const ar_common_loadingshareddata2 = /** @type {(inputs: Common_Loadingshareddata2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل البيانات المشتركة…`)
};

/**
* | output |
* | --- |
* | "Loading shared data…" |
*
* @param {Common_Loadingshareddata2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_loadingshareddata2 = /** @type {((inputs?: Common_Loadingshareddata2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Loadingshareddata2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_loadingshareddata2(inputs)
	if (locale === "es") return es_common_loadingshareddata2(inputs)
	if (locale === "fr") return fr_common_loadingshareddata2(inputs)
	return ar_common_loadingshareddata2(inputs)
});
export { common_loadingshareddata2 as "common.loadingSharedData" }