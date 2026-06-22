/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Guardianinvite_Sharelink2Inputs */

const en_family_guardianinvite_sharelink2 = /** @type {(inputs: Family_Guardianinvite_Sharelink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Share Link`)
};

const es_family_guardianinvite_sharelink2 = /** @type {(inputs: Family_Guardianinvite_Sharelink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Compartir enlace`)
};

const fr_family_guardianinvite_sharelink2 = /** @type {(inputs: Family_Guardianinvite_Sharelink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Partager le lien`)
};

const ar_family_guardianinvite_sharelink2 = /** @type {(inputs: Family_Guardianinvite_Sharelink2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`مشاركة الرابط`)
};

/**
* | output |
* | --- |
* | "Share Link" |
*
* @param {Family_Guardianinvite_Sharelink2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_guardianinvite_sharelink2 = /** @type {((inputs?: Family_Guardianinvite_Sharelink2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Guardianinvite_Sharelink2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_guardianinvite_sharelink2(inputs)
	if (locale === "es") return es_family_guardianinvite_sharelink2(inputs)
	if (locale === "fr") return fr_family_guardianinvite_sharelink2(inputs)
	return ar_family_guardianinvite_sharelink2(inputs)
});
export { family_guardianinvite_sharelink2 as "family.guardianInvite.shareLink" }