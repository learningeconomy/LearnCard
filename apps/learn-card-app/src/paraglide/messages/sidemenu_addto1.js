/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ brand: NonNullable<unknown> }} Sidemenu_Addto1Inputs */

const en_sidemenu_addto1 = /** @type {(inputs: Sidemenu_Addto1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Add to ${i?.brand}`)
};

const es_sidemenu_addto1 = /** @type {(inputs: Sidemenu_Addto1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Agregar a ${i?.brand}`)
};

const de_sidemenu_addto1 = /** @type {(inputs: Sidemenu_Addto1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Zu ${i?.brand} hinzufügen`)
};

const ar_sidemenu_addto1 = /** @type {(inputs: Sidemenu_Addto1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إضافة إلى ${i?.brand}`)
};

const fr_sidemenu_addto1 = /** @type {(inputs: Sidemenu_Addto1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ajouter à ${i?.brand}`)
};

const ko_sidemenu_addto1 = /** @type {(inputs: Sidemenu_Addto1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`${i?.brand}에 추가`)
};

/**
* | output |
* | --- |
* | "Add to {brand}" |
*
* @param {Sidemenu_Addto1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const sidemenu_addto1 = /** @type {((inputs: Sidemenu_Addto1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Addto1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_addto1(inputs)
	if (locale === "es") return es_sidemenu_addto1(inputs)
	if (locale === "de") return de_sidemenu_addto1(inputs)
	if (locale === "ar") return ar_sidemenu_addto1(inputs)
	if (locale === "fr") return fr_sidemenu_addto1(inputs)
	return ko_sidemenu_addto1(inputs)
});
export { sidemenu_addto1 as "sidemenu.addTo" }