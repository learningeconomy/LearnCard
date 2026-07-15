/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Adminsdesc4Inputs */

const en_boostcms_adminsdesc4 = /** @type {(inputs: Boostcms_Adminsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Admins are granted permission to send and edit this Boost.`)
};

const es_boostcms_adminsdesc4 = /** @type {(inputs: Boostcms_Adminsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los admins tienen permiso para enviar y editar este Boost.`)
};

const fr_boostcms_adminsdesc4 = /** @type {(inputs: Boostcms_Adminsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les administrateurs ont l'autorisation d'envoyer et de modifier ce Boost.`)
};

const ar_boostcms_adminsdesc4 = /** @type {(inputs: Boostcms_Adminsdesc4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`يُمنح المسؤولون صلاحية إرسال وتعديل هذا التعزيز.`)
};

/**
* | output |
* | --- |
* | "Admins are granted permission to send and edit this Boost." |
*
* @param {Boostcms_Adminsdesc4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_adminsdesc4 = /** @type {((inputs?: Boostcms_Adminsdesc4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Adminsdesc4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_adminsdesc4(inputs)
	if (locale === "es") return es_boostcms_adminsdesc4(inputs)
	if (locale === "fr") return fr_boostcms_adminsdesc4(inputs)
	return ar_boostcms_adminsdesc4(inputs)
});
export { boostcms_adminsdesc4 as "boostCMS.adminsDesc" }