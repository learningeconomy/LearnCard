/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_Loadingdatatruck2Inputs */

const en_common_loadingdatatruck2 = /** @type {(inputs: Common_Loadingdatatruck2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading the data truck…`)
};

const es_common_loadingdatatruck2 = /** @type {(inputs: Common_Loadingdatatruck2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando el camión de datos…`)
};

const fr_common_loadingdatatruck2 = /** @type {(inputs: Common_Loadingdatatruck2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement du camion de données…`)
};

const ar_common_loadingdatatruck2 = /** @type {(inputs: Common_Loadingdatatruck2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري تحميل شاحنة البيانات…`)
};

/**
* | output |
* | --- |
* | "Loading the data truck…" |
*
* @param {Common_Loadingdatatruck2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_loadingdatatruck2 = /** @type {((inputs?: Common_Loadingdatatruck2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_Loadingdatatruck2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_loadingdatatruck2(inputs)
	if (locale === "es") return es_common_loadingdatatruck2(inputs)
	if (locale === "fr") return fr_common_loadingdatatruck2(inputs)
	return ar_common_loadingdatatruck2(inputs)
});
export { common_loadingdatatruck2 as "common.loadingDataTruck" }