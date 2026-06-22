/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Empty_Title1Inputs */

const en_datasharing_empty_title1 = /** @type {(inputs: Datasharing_Empty_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No data sharing yet`)
};

const es_datasharing_empty_title1 = /** @type {(inputs: Datasharing_Empty_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no compartes datos`)
};

const fr_datasharing_empty_title1 = /** @type {(inputs: Datasharing_Empty_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun partage de données pour le moment`)
};

const ar_datasharing_empty_title1 = /** @type {(inputs: Datasharing_Empty_Title1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد مشاركة بيانات بعد`)
};

/**
* | output |
* | --- |
* | "No data sharing yet" |
*
* @param {Datasharing_Empty_Title1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_empty_title1 = /** @type {((inputs?: Datasharing_Empty_Title1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Empty_Title1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_empty_title1(inputs)
	if (locale === "es") return es_datasharing_empty_title1(inputs)
	if (locale === "fr") return fr_datasharing_empty_title1(inputs)
	return ar_datasharing_empty_title1(inputs)
});
export { datasharing_empty_title1 as "dataSharing.empty.title" }