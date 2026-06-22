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

const fr_sidemenu_addto1 = /** @type {(inputs: Sidemenu_Addto1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Ajouter à ${i?.brand}`)
};

const ar_sidemenu_addto1 = /** @type {(inputs: Sidemenu_Addto1Inputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`إضافة إلى ${i?.brand}`)
};

/**
* | output |
* | --- |
* | "Add to {brand}" |
*
* @param {Sidemenu_Addto1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const sidemenu_addto1 = /** @type {((inputs: Sidemenu_Addto1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidemenu_Addto1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidemenu_addto1(inputs)
	if (locale === "es") return es_sidemenu_addto1(inputs)
	if (locale === "fr") return fr_sidemenu_addto1(inputs)
	return ar_sidemenu_addto1(inputs)
});
export { sidemenu_addto1 as "sidemenu.addTo" }