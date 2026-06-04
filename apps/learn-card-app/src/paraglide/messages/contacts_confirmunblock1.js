/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_Confirmunblock1Inputs */

const en_contacts_confirmunblock1 = /** @type {(inputs: Contacts_Confirmunblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to unblock this user?`)
};

const es_contacts_confirmunblock1 = /** @type {(inputs: Contacts_Confirmunblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Estás seguro de que quieres desbloquear a este usuario?`)
};

const de_contacts_confirmunblock1 = /** @type {(inputs: Contacts_Confirmunblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Möchtest du diesen Benutzer wirklich entblocken?`)
};

const ar_contacts_confirmunblock1 = /** @type {(inputs: Contacts_Confirmunblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد إلغاء حظر هذا المستخدم؟`)
};

const fr_contacts_confirmunblock1 = /** @type {(inputs: Contacts_Confirmunblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous vraiment débloquer cet utilisateur ?`)
};

const ko_contacts_confirmunblock1 = /** @type {(inputs: Contacts_Confirmunblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 사용자의 차단을 해제하시겠습니까?`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to unblock this user?" |
*
* @param {Contacts_Confirmunblock1Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_confirmunblock1 = /** @type {((inputs?: Contacts_Confirmunblock1Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Confirmunblock1Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_confirmunblock1(inputs)
	if (locale === "es") return es_contacts_confirmunblock1(inputs)
	if (locale === "de") return de_contacts_confirmunblock1(inputs)
	if (locale === "ar") return ar_contacts_confirmunblock1(inputs)
	if (locale === "fr") return fr_contacts_confirmunblock1(inputs)
	return ko_contacts_confirmunblock1(inputs)
});
export { contacts_confirmunblock1 as "contacts.confirmUnblock" }