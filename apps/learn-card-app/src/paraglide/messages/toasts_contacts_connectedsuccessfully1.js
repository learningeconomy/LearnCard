/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Contacts_Connectedsuccessfully1Inputs */

const en_toasts_contacts_connectedsuccessfully1 = /** @type {(inputs: Toasts_Contacts_Connectedsuccessfully1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connected successfully!`)
};

const es_toasts_contacts_connectedsuccessfully1 = /** @type {(inputs: Toasts_Contacts_Connectedsuccessfully1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Conectado exitosamente!`)
};

const fr_toasts_contacts_connectedsuccessfully1 = /** @type {(inputs: Toasts_Contacts_Connectedsuccessfully1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connecté avec succès !`)
};

const ar_toasts_contacts_connectedsuccessfully1 = /** @type {(inputs: Toasts_Contacts_Connectedsuccessfully1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الاتصال بنجاح!`)
};

/**
* | output |
* | --- |
* | "Connected successfully!" |
*
* @param {Toasts_Contacts_Connectedsuccessfully1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const toasts_contacts_connectedsuccessfully1 = /** @type {((inputs?: Toasts_Contacts_Connectedsuccessfully1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Contacts_Connectedsuccessfully1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_contacts_connectedsuccessfully1(inputs)
	if (locale === "es") return es_toasts_contacts_connectedsuccessfully1(inputs)
	if (locale === "fr") return fr_toasts_contacts_connectedsuccessfully1(inputs)
	return ar_toasts_contacts_connectedsuccessfully1(inputs)
});
export { toasts_contacts_connectedsuccessfully1 as "toasts.contacts.connectedSuccessfully" }