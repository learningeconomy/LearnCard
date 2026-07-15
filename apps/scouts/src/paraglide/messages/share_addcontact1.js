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

const fr_share_addcontact1 = /** @type {(inputs: Share_Addcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter un contact`)
};

const ar_share_addcontact1 = /** @type {(inputs: Share_Addcontact1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إضافة جهة اتصال`)
};

/**
* | output |
* | --- |
* | "Add contact" |
*
* @param {Share_Addcontact1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const share_addcontact1 = /** @type {((inputs?: Share_Addcontact1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Share_Addcontact1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_share_addcontact1(inputs)
	if (locale === "es") return es_share_addcontact1(inputs)
	if (locale === "fr") return fr_share_addcontact1(inputs)
	return ar_share_addcontact1(inputs)
});
export { share_addcontact1 as "share.addContact" }