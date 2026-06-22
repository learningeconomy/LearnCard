/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Family_Guardianinvite_Browsecontacts2Inputs */

const en_family_guardianinvite_browsecontacts2 = /** @type {(inputs: Family_Guardianinvite_Browsecontacts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Browse Contacts`)
};

const es_family_guardianinvite_browsecontacts2 = /** @type {(inputs: Family_Guardianinvite_Browsecontacts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Explorar contactos`)
};

const fr_family_guardianinvite_browsecontacts2 = /** @type {(inputs: Family_Guardianinvite_Browsecontacts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parcourir les contacts`)
};

const ar_family_guardianinvite_browsecontacts2 = /** @type {(inputs: Family_Guardianinvite_Browsecontacts2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تصفّح جهات الاتصال`)
};

/**
* | output |
* | --- |
* | "Browse Contacts" |
*
* @param {Family_Guardianinvite_Browsecontacts2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const family_guardianinvite_browsecontacts2 = /** @type {((inputs?: Family_Guardianinvite_Browsecontacts2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Family_Guardianinvite_Browsecontacts2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_family_guardianinvite_browsecontacts2(inputs)
	if (locale === "es") return es_family_guardianinvite_browsecontacts2(inputs)
	if (locale === "fr") return fr_family_guardianinvite_browsecontacts2(inputs)
	return ar_family_guardianinvite_browsecontacts2(inputs)
});
export { family_guardianinvite_browsecontacts2 as "family.guardianInvite.browseContacts" }