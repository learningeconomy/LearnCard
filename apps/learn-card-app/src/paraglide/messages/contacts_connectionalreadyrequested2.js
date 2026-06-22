/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Connectionalreadyrequested2Inputs */

const en_contacts_connectionalreadyrequested2 = /** @type {(inputs: Contacts_Connectionalreadyrequested2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connection already requested`)
};

const es_contacts_connectionalreadyrequested2 = /** @type {(inputs: Contacts_Connectionalreadyrequested2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Conexión ya solicitada`)
};

const fr_contacts_connectionalreadyrequested2 = /** @type {(inputs: Contacts_Connectionalreadyrequested2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion déjà demandée`)
};

const ar_contacts_connectionalreadyrequested2 = /** @type {(inputs: Contacts_Connectionalreadyrequested2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاتصال مطلوب بالفعل`)
};

/**
* | output |
* | --- |
* | "Connection already requested" |
*
* @param {Contacts_Connectionalreadyrequested2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_connectionalreadyrequested2 = /** @type {((inputs?: Contacts_Connectionalreadyrequested2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Connectionalreadyrequested2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_connectionalreadyrequested2(inputs)
	if (locale === "es") return es_contacts_connectionalreadyrequested2(inputs)
	if (locale === "fr") return fr_contacts_connectionalreadyrequested2(inputs)
	return ar_contacts_connectionalreadyrequested2(inputs)
});
export { contacts_connectionalreadyrequested2 as "contacts.connectionAlreadyRequested" }