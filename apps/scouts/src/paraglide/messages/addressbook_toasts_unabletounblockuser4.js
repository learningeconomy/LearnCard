/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Toasts_Unabletounblockuser4Inputs */

const en_addressbook_toasts_unabletounblockuser4 = /** @type {(inputs: Addressbook_Toasts_Unabletounblockuser4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`An error occurred, unable to unblock user`)
};

const es_addressbook_toasts_unabletounblockuser4 = /** @type {(inputs: Addressbook_Toasts_Unabletounblockuser4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ocurrió un error, no se pudo desbloquear al usuario.`)
};

const fr_addressbook_toasts_unabletounblockuser4 = /** @type {(inputs: Addressbook_Toasts_Unabletounblockuser4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur est survenue, impossible de débloquer l'utilisateur`)
};

const ar_addressbook_toasts_unabletounblockuser4 = /** @type {(inputs: Addressbook_Toasts_Unabletounblockuser4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حدث خطأ، تعذر إلغاء حظر المستخدم`)
};

/**
* | output |
* | --- |
* | "An error occurred, unable to unblock user" |
*
* @param {Addressbook_Toasts_Unabletounblockuser4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_toasts_unabletounblockuser4 = /** @type {((inputs?: Addressbook_Toasts_Unabletounblockuser4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Toasts_Unabletounblockuser4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_toasts_unabletounblockuser4(inputs)
	if (locale === "es") return es_addressbook_toasts_unabletounblockuser4(inputs)
	if (locale === "fr") return fr_addressbook_toasts_unabletounblockuser4(inputs)
	return ar_addressbook_toasts_unabletounblockuser4(inputs)
});
export { addressbook_toasts_unabletounblockuser4 as "addressBook.toasts.unableToUnblockUser" }