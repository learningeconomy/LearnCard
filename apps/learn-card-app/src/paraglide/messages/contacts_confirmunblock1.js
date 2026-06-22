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

const fr_contacts_confirmunblock1 = /** @type {(inputs: Contacts_Confirmunblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voulez-vous vraiment débloquer cet utilisateur ?`)
};

const ar_contacts_confirmunblock1 = /** @type {(inputs: Contacts_Confirmunblock1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد أنك تريد إلغاء حظر هذا المستخدم؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to unblock this user?" |
*
* @param {Contacts_Confirmunblock1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_confirmunblock1 = /** @type {((inputs?: Contacts_Confirmunblock1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_Confirmunblock1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_confirmunblock1(inputs)
	if (locale === "es") return es_contacts_confirmunblock1(inputs)
	if (locale === "fr") return fr_contacts_confirmunblock1(inputs)
	return ar_contacts_confirmunblock1(inputs)
});
export { contacts_confirmunblock1 as "contacts.confirmUnblock" }