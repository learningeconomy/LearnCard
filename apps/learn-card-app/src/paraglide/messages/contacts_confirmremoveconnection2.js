/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Confirmremoveconnection2Inputs */

const en_contacts_confirmremoveconnection2 = /** @type {(inputs: Contacts_Confirmremoveconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to remove this connection?`)
};

const es_contacts_confirmremoveconnection2 = /** @type {(inputs: Contacts_Confirmremoveconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que quieres eliminar esta conexión?`)
};

const de_contacts_confirmremoveconnection2 = /** @type {(inputs: Contacts_Confirmremoveconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Möchtest du diese Verbindung wirklich entfernen?`)
};

const ar_contacts_confirmremoveconnection2 = /** @type {(inputs: Contacts_Confirmremoveconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد إزالة هذا الاتصال؟`)
};

const fr_contacts_confirmremoveconnection2 = /** @type {(inputs: Contacts_Confirmremoveconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous vraiment supprimer cette connexion ?`)
};

const ko_contacts_confirmremoveconnection2 = /** @type {(inputs: Contacts_Confirmremoveconnection2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 연결을 삭제하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to remove this connection?" |
*
* @param {Contacts_Confirmremoveconnection2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_confirmremoveconnection2 = /** @type {((inputs?: Contacts_Confirmremoveconnection2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Confirmremoveconnection2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_confirmremoveconnection2(inputs)
	if (locale === "es") return es_contacts_confirmremoveconnection2(inputs)
	if (locale === "de") return de_contacts_confirmremoveconnection2(inputs)
	if (locale === "ar") return ar_contacts_confirmremoveconnection2(inputs)
	if (locale === "fr") return fr_contacts_confirmremoveconnection2(inputs)
	return ko_contacts_confirmremoveconnection2(inputs)
});
export { contacts_confirmremoveconnection2 as "contacts.confirmRemoveConnection" }