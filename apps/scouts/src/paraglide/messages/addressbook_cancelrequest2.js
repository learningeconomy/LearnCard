/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Cancelrequest2Inputs */

const en_addressbook_cancelrequest2 = /** @type {(inputs: Addressbook_Cancelrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancel Request`)
};

const es_addressbook_cancelrequest2 = /** @type {(inputs: Addressbook_Cancelrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancelar Solicitud`)
};

const fr_addressbook_cancelrequest2 = /** @type {(inputs: Addressbook_Cancelrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler la demande`)
};

const ar_addressbook_cancelrequest2 = /** @type {(inputs: Addressbook_Cancelrequest2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء الطلب`)
};

/**
* | output |
* | --- |
* | "Cancel Request" |
*
* @param {Addressbook_Cancelrequest2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_cancelrequest2 = /** @type {((inputs?: Addressbook_Cancelrequest2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Cancelrequest2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_cancelrequest2(inputs)
	if (locale === "es") return es_addressbook_cancelrequest2(inputs)
	if (locale === "fr") return fr_addressbook_cancelrequest2(inputs)
	return ar_addressbook_cancelrequest2(inputs)
});
export { addressbook_cancelrequest2 as "addressBook.cancelRequest" }