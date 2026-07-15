/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Confirmunblockuser3Inputs */

const en_addressbook_confirmunblockuser3 = /** @type {(inputs: Addressbook_Confirmunblockuser3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Are you sure you want to unblock this user?`)
};

const es_addressbook_confirmunblockuser3 = /** @type {(inputs: Addressbook_Confirmunblockuser3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¿Seguro que quieres desbloquear a este usuario?`)
};

const fr_addressbook_confirmunblockuser3 = /** @type {(inputs: Addressbook_Confirmunblockuser3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Êtes-vous sûr de vouloir débloquer cet utilisateur ?`)
};

const ar_addressbook_confirmunblockuser3 = /** @type {(inputs: Addressbook_Confirmunblockuser3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`هل أنت متأكد من إلغاء حظر هذا المستخدم؟`)
};

/**
* | output |
* | --- |
* | "Are you sure you want to unblock this user?" |
*
* @param {Addressbook_Confirmunblockuser3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_confirmunblockuser3 = /** @type {((inputs?: Addressbook_Confirmunblockuser3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Confirmunblockuser3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_confirmunblockuser3(inputs)
	if (locale === "es") return es_addressbook_confirmunblockuser3(inputs)
	if (locale === "fr") return fr_addressbook_confirmunblockuser3(inputs)
	return ar_addressbook_confirmunblockuser3(inputs)
});
export { addressbook_confirmunblockuser3 as "addressBook.confirmUnblockUser" }