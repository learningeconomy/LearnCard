/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Connectedsuccessfully1Inputs */

const en_contacts_connectedsuccessfully1 = /** @type {(inputs: Contacts_Connectedsuccessfully1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connected Successfully`)
};

const es_contacts_connectedsuccessfully1 = /** @type {(inputs: Contacts_Connectedsuccessfully1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conectado exitosamente`)
};

const de_contacts_connectedsuccessfully1 = /** @type {(inputs: Contacts_Connectedsuccessfully1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erfolgreich verbunden`)
};

const ar_contacts_connectedsuccessfully1 = /** @type {(inputs: Contacts_Connectedsuccessfully1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الاتصال بنجاح`)
};

const fr_contacts_connectedsuccessfully1 = /** @type {(inputs: Contacts_Connectedsuccessfully1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connecté avec succès`)
};

const ko_contacts_connectedsuccessfully1 = /** @type {(inputs: Contacts_Connectedsuccessfully1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`성공적으로 연결됨`)
};

/**
* | output |
* | --- |
* | "Connected Successfully" |
*
* @param {Contacts_Connectedsuccessfully1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_connectedsuccessfully1 = /** @type {((inputs?: Contacts_Connectedsuccessfully1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Connectedsuccessfully1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_connectedsuccessfully1(inputs)
	if (locale === "es") return es_contacts_connectedsuccessfully1(inputs)
	if (locale === "de") return de_contacts_connectedsuccessfully1(inputs)
	if (locale === "ar") return ar_contacts_connectedsuccessfully1(inputs)
	if (locale === "fr") return fr_contacts_connectedsuccessfully1(inputs)
	return ko_contacts_connectedsuccessfully1(inputs)
});
export { contacts_connectedsuccessfully1 as "contacts.connectedSuccessfully" }