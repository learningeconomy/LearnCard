/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Datasharing_Empty_Subtitle1Inputs */

const en_datasharing_empty_subtitle1 = /** @type {(inputs: Datasharing_Empty_Subtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When you connect apps, they'll appear here.`)
};

const es_datasharing_empty_subtitle1 = /** @type {(inputs: Datasharing_Empty_Subtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuando conectes aplicaciones, aparecerán aquí.`)
};

const fr_datasharing_empty_subtitle1 = /** @type {(inputs: Datasharing_Empty_Subtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lorsque vous connecterez des applications, elles apparaîtront ici.`)
};

const ar_datasharing_empty_subtitle1 = /** @type {(inputs: Datasharing_Empty_Subtitle1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عند ربط التطبيقات، ستظهر هنا.`)
};

/**
* | output |
* | --- |
* | "When you connect apps, they'll appear here." |
*
* @param {Datasharing_Empty_Subtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_empty_subtitle1 = /** @type {((inputs?: Datasharing_Empty_Subtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Empty_Subtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_empty_subtitle1(inputs)
	if (locale === "es") return es_datasharing_empty_subtitle1(inputs)
	if (locale === "fr") return fr_datasharing_empty_subtitle1(inputs)
	return ar_datasharing_empty_subtitle1(inputs)
});
export { datasharing_empty_subtitle1 as "dataSharing.empty.subtitle" }