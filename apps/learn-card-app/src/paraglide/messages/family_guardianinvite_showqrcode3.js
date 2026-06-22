/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Guardianinvite_Showqrcode3Inputs */

const en_family_guardianinvite_showqrcode3 = /** @type {(inputs: Family_Guardianinvite_Showqrcode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Show QR Code`)
};

const es_family_guardianinvite_showqrcode3 = /** @type {(inputs: Family_Guardianinvite_Showqrcode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mostrar código QR`)
};

const fr_family_guardianinvite_showqrcode3 = /** @type {(inputs: Family_Guardianinvite_Showqrcode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Afficher le code QR`)
};

const ar_family_guardianinvite_showqrcode3 = /** @type {(inputs: Family_Guardianinvite_Showqrcode3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض رمز QR`)
};

/**
* | output |
* | --- |
* | "Show QR Code" |
*
* @param {Family_Guardianinvite_Showqrcode3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_guardianinvite_showqrcode3 = /** @type {((inputs?: Family_Guardianinvite_Showqrcode3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Guardianinvite_Showqrcode3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_guardianinvite_showqrcode3(inputs)
	if (locale === "es") return es_family_guardianinvite_showqrcode3(inputs)
	if (locale === "fr") return fr_family_guardianinvite_showqrcode3(inputs)
	return ar_family_guardianinvite_showqrcode3(inputs)
});
export { family_guardianinvite_showqrcode3 as "family.guardianInvite.showQrCode" }