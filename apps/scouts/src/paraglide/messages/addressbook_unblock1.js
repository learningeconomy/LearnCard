/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Unblock1Inputs */

const en_addressbook_unblock1 = /** @type {(inputs: Addressbook_Unblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unblock`)
};

const es_addressbook_unblock1 = /** @type {(inputs: Addressbook_Unblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Desbloquear`)
};

const fr_addressbook_unblock1 = /** @type {(inputs: Addressbook_Unblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Débloquer`)
};

const ar_addressbook_unblock1 = /** @type {(inputs: Addressbook_Unblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء الحظر`)
};

/**
* | output |
* | --- |
* | "Unblock" |
*
* @param {Addressbook_Unblock1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_unblock1 = /** @type {((inputs?: Addressbook_Unblock1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Unblock1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_unblock1(inputs)
	if (locale === "es") return es_addressbook_unblock1(inputs)
	if (locale === "fr") return fr_addressbook_unblock1(inputs)
	return ar_addressbook_unblock1(inputs)
});
export { addressbook_unblock1 as "addressBook.unblock" }