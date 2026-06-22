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

const fr_contacts_cancelrequest1 = /** @type {(inputs: Contacts_Cancelrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler la demande`)
};

const ar_contacts_cancelrequest1 = /** @type {(inputs: Contacts_Cancelrequest1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إلغاء الطلب`)
};

/**
* | output |
* | --- |
* | "Cancel Request" |
*
* @param {Contacts_Cancelrequest1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_cancelrequest1 = /** @type {((inputs?: Contacts_Cancelrequest1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Cancelrequest1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_cancelrequest1(inputs)
	if (locale === "es") return es_contacts_cancelrequest1(inputs)
	if (locale === "fr") return fr_contacts_cancelrequest1(inputs)
	return ar_contacts_cancelrequest1(inputs)
});
export { contacts_cancelrequest1 as "contacts.cancelRequest" }