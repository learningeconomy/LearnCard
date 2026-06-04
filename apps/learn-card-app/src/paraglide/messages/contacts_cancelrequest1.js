/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Cancelrequest1Inputs */

const en_contacts_cancelrequest1 = /** @type {(inputs: Contacts_Cancelrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancel Request`)
};

const es_contacts_cancelrequest1 = /** @type {(inputs: Contacts_Cancelrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cancelar solicitud`)
};

const de_contacts_cancelrequest1 = /** @type {(inputs: Contacts_Cancelrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anfrage abbrechen`)
};

const ar_contacts_cancelrequest1 = /** @type {(inputs: Contacts_Cancelrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء الطلب`)
};

const fr_contacts_cancelrequest1 = /** @type {(inputs: Contacts_Cancelrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler la demande`)
};

const ko_contacts_cancelrequest1 = /** @type {(inputs: Contacts_Cancelrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`요청 취소`)
};

/**
* | output |
* | --- |
* | "Cancel Request" |
*
* @param {Contacts_Cancelrequest1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_cancelrequest1 = /** @type {((inputs?: Contacts_Cancelrequest1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Cancelrequest1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_cancelrequest1(inputs)
	if (locale === "es") return es_contacts_cancelrequest1(inputs)
	if (locale === "de") return de_contacts_cancelrequest1(inputs)
	if (locale === "ar") return ar_contacts_cancelrequest1(inputs)
	if (locale === "fr") return fr_contacts_cancelrequest1(inputs)
	return ko_contacts_cancelrequest1(inputs)
});
export { contacts_cancelrequest1 as "contacts.cancelRequest" }