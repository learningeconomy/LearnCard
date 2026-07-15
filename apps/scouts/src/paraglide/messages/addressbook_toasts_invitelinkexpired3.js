/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Toasts_Invitelinkexpired3Inputs */

const en_addressbook_toasts_invitelinkexpired3 = /** @type {(inputs: Addressbook_Toasts_Invitelinkexpired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invite link has expired!`)
};

const es_addressbook_toasts_invitelinkexpired3 = /** @type {(inputs: Addressbook_Toasts_Invitelinkexpired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡El enlace de invitación ha expirado!`)
};

const fr_addressbook_toasts_invitelinkexpired3 = /** @type {(inputs: Addressbook_Toasts_Invitelinkexpired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Le lien d'invitation a expiré !`)
};

const ar_addressbook_toasts_invitelinkexpired3 = /** @type {(inputs: Addressbook_Toasts_Invitelinkexpired3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Invite link has expired!`)
};

/**
* | output |
* | --- |
* | "Invite link has expired!" |
*
* @param {Addressbook_Toasts_Invitelinkexpired3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_toasts_invitelinkexpired3 = /** @type {((inputs?: Addressbook_Toasts_Invitelinkexpired3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Toasts_Invitelinkexpired3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_toasts_invitelinkexpired3(inputs)
	if (locale === "es") return es_addressbook_toasts_invitelinkexpired3(inputs)
	if (locale === "fr") return fr_addressbook_toasts_invitelinkexpired3(inputs)
	return ar_addressbook_toasts_invitelinkexpired3(inputs)
});
export { addressbook_toasts_invitelinkexpired3 as "addressBook.toasts.inviteLinkExpired" }