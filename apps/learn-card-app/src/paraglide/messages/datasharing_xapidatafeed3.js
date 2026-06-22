/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Xapidatafeed3Inputs */

const en_datasharing_xapidatafeed3 = /** @type {(inputs: Datasharing_Xapidatafeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`xAPI Data Feed`)
};

const es_datasharing_xapidatafeed3 = /** @type {(inputs: Datasharing_Xapidatafeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flujo de datos xAPI`)
};

const fr_datasharing_xapidatafeed3 = /** @type {(inputs: Datasharing_Xapidatafeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flux de données xAPI`)
};

const ar_datasharing_xapidatafeed3 = /** @type {(inputs: Datasharing_Xapidatafeed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تدفق بيانات xAPI`)
};

/**
* | output |
* | --- |
* | "xAPI Data Feed" |
*
* @param {Datasharing_Xapidatafeed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_xapidatafeed3 = /** @type {((inputs?: Datasharing_Xapidatafeed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Xapidatafeed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_xapidatafeed3(inputs)
	if (locale === "es") return es_datasharing_xapidatafeed3(inputs)
	if (locale === "fr") return fr_datasharing_xapidatafeed3(inputs)
	return ar_datasharing_xapidatafeed3(inputs)
});
export { datasharing_xapidatafeed3 as "dataSharing.xapiDataFeed" }