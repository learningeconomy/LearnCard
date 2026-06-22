/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Pin_DescriptionInputs */

const en_family_pin_description = /** @type {(inputs: Family_Pin_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Your pin allows you to access and manage controls that require your authorization.`)
};

const es_family_pin_description = /** @type {(inputs: Family_Pin_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tu PIN te permite acceder y gestionar los controles que requieren tu autorización.`)
};

const fr_family_pin_description = /** @type {(inputs: Family_Pin_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Votre code PIN vous permet d'accéder aux contrôles qui nécessitent votre autorisation et de les gérer.`)
};

const ar_family_pin_description = /** @type {(inputs: Family_Pin_DescriptionInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يتيح لك رقم التعريف الشخصي الوصول إلى عناصر التحكم التي تتطلب تفويضك وإدارتها.`)
};

/**
* | output |
* | --- |
* | "Your pin allows you to access and manage controls that require your authorization." |
*
* @param {Family_Pin_DescriptionInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_pin_description = /** @type {((inputs?: Family_Pin_DescriptionInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Pin_DescriptionInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_pin_description(inputs)
	if (locale === "es") return es_family_pin_description(inputs)
	if (locale === "fr") return fr_family_pin_description(inputs)
	return ar_family_pin_description(inputs)
});
export { family_pin_description as "family.pin.description" }