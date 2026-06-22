/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Appdetails2Inputs */

const en_datasharing_appdetails2 = /** @type {(inputs: Datasharing_Appdetails2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Details`)
};

const es_datasharing_appdetails2 = /** @type {(inputs: Datasharing_Appdetails2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Detalles de la aplicación`)
};

const fr_datasharing_appdetails2 = /** @type {(inputs: Datasharing_Appdetails2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Détails de l'application`)
};

const ar_datasharing_appdetails2 = /** @type {(inputs: Datasharing_Appdetails2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تفاصيل التطبيق`)
};

/**
* | output |
* | --- |
* | "App Details" |
*
* @param {Datasharing_Appdetails2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_appdetails2 = /** @type {((inputs?: Datasharing_Appdetails2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Appdetails2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_appdetails2(inputs)
	if (locale === "es") return es_datasharing_appdetails2(inputs)
	if (locale === "fr") return fr_datasharing_appdetails2(inputs)
	return ar_datasharing_appdetails2(inputs)
});
export { datasharing_appdetails2 as "dataSharing.appDetails" }