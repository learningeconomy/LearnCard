/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Datasharing_Subtitle1Inputs */

const en_datasharing_subtitle1 = /** @type {(inputs: Datasharing_Subtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Apps and services you've given permission to access your ${i?.brand} data.`)
};

const es_datasharing_subtitle1 = /** @type {(inputs: Datasharing_Subtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Aplicaciones y servicios a los que has dado permiso para acceder a tus datos de ${i?.brand}.`)
};

const fr_datasharing_subtitle1 = /** @type {(inputs: Datasharing_Subtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Applications et services auxquels vous avez autorisé l'accès à vos données ${i?.brand}.`)
};

const ar_datasharing_subtitle1 = /** @type {(inputs: Datasharing_Subtitle1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`التطبيقات والخدمات التي منحتها إذن الوصول إلى بيانات ${i?.brand} الخاصة بك.`)
};

/**
* | output |
* | --- |
* | "Apps and services you've given permission to access your {brand} data." |
*
* @param {Datasharing_Subtitle1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const datasharing_subtitle1 = /** @type {((inputs: Datasharing_Subtitle1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Datasharing_Subtitle1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_datasharing_subtitle1(inputs)
	if (locale === "es") return es_datasharing_subtitle1(inputs)
	if (locale === "fr") return fr_datasharing_subtitle1(inputs)
	return ar_datasharing_subtitle1(inputs)
});
export { datasharing_subtitle1 as "dataSharing.subtitle" }