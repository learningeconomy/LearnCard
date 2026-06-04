/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Connectionsent1Inputs */

const en_contacts_connectionsent1 = /** @type {(inputs: Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connection Request sent`)
};

const es_contacts_connectionsent1 = /** @type {(inputs: Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicitud de conexión enviada`)
};

const de_contacts_connectionsent1 = /** @type {(inputs: Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Verbindungsanfrage gesendet`)
};

const ar_contacts_connectionsent1 = /** @type {(inputs: Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم إرسال طلب الاتصال`)
};

const fr_contacts_connectionsent1 = /** @type {(inputs: Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demande de connexion envoyée`)
};

const ko_contacts_connectionsent1 = /** @type {(inputs: Contacts_Connectionsent1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`연결 요청이 전송되었습니다`)
};

/**
* | output |
* | --- |
* | "Connection Request sent" |
*
* @param {Contacts_Connectionsent1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_connectionsent1 = /** @type {((inputs?: Contacts_Connectionsent1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Connectionsent1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_connectionsent1(inputs)
	if (locale === "es") return es_contacts_connectionsent1(inputs)
	if (locale === "de") return de_contacts_connectionsent1(inputs)
	if (locale === "ar") return ar_contacts_connectionsent1(inputs)
	if (locale === "fr") return fr_contacts_connectionsent1(inputs)
	return ko_contacts_connectionsent1(inputs)
});
export { contacts_connectionsent1 as "contacts.connectionSent" }