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

const de_contacts_connectionalreadyrequested2 = /** @type {(inputs: Contacts_Connectionalreadyrequested2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verbindung bereits angefragt`)
};

const ar_contacts_connectionalreadyrequested2 = /** @type {(inputs: Contacts_Connectionalreadyrequested2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الاتصال مطلوب بالفعل`)
};

const fr_contacts_connectionalreadyrequested2 = /** @type {(inputs: Contacts_Connectionalreadyrequested2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion déjà demandée`)
};

const ko_contacts_connectionalreadyrequested2 = /** @type {(inputs: Contacts_Connectionalreadyrequested2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이미 연결을 요청했습니다`)
};

/**
* | output |
* | --- |
* | "Connection already requested" |
*
* @param {Contacts_Connectionalreadyrequested2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_connectionalreadyrequested2 = /** @type {((inputs?: Contacts_Connectionalreadyrequested2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Connectionalreadyrequested2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_connectionalreadyrequested2(inputs)
	if (locale === "es") return es_contacts_connectionalreadyrequested2(inputs)
	if (locale === "de") return de_contacts_connectionalreadyrequested2(inputs)
	if (locale === "ar") return ar_contacts_connectionalreadyrequested2(inputs)
	if (locale === "fr") return fr_contacts_connectionalreadyrequested2(inputs)
	return ko_contacts_connectionalreadyrequested2(inputs)
});
export { contacts_connectionalreadyrequested2 as "contacts.connectionAlreadyRequested" }