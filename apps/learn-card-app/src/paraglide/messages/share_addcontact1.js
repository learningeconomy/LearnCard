/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Share_Addcontact1Inputs */

const en_share_addcontact1 = /** @type {(inputs: Share_Addcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Add contact`)
};

const es_share_addcontact1 = /** @type {(inputs: Share_Addcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Agregar contacto`)
};

const de_share_addcontact1 = /** @type {(inputs: Share_Addcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Kontakt hinzufügen`)
};

const ar_share_addcontact1 = /** @type {(inputs: Share_Addcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة جهة اتصال`)
};

const fr_share_addcontact1 = /** @type {(inputs: Share_Addcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un contact`)
};

const ko_share_addcontact1 = /** @type {(inputs: Share_Addcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연락처 추가`)
};

/**
* | output |
* | --- |
* | "Add contact" |
*
* @param {Share_Addcontact1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const share_addcontact1 = /** @type {((inputs?: Share_Addcontact1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Addcontact1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_addcontact1(inputs)
	if (locale === "es") return es_share_addcontact1(inputs)
	if (locale === "de") return de_share_addcontact1(inputs)
	if (locale === "ar") return ar_share_addcontact1(inputs)
	if (locale === "fr") return fr_share_addcontact1(inputs)
	return ko_share_addcontact1(inputs)
});
export { share_addcontact1 as "share.addContact" }