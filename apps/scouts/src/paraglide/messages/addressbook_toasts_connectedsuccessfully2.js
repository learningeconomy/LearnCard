/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Addressbook_Toasts_Connectedsuccessfully2Inputs */

const en_addressbook_toasts_connectedsuccessfully2 = /** @type {(inputs: Addressbook_Toasts_Connectedsuccessfully2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connected Successfully!`)
};

const es_addressbook_toasts_connectedsuccessfully2 = /** @type {(inputs: Addressbook_Toasts_Connectedsuccessfully2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Conectado Exitosamente!`)
};

const fr_addressbook_toasts_connectedsuccessfully2 = /** @type {(inputs: Addressbook_Toasts_Connectedsuccessfully2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connecté avec succès !`)
};

const ar_addressbook_toasts_connectedsuccessfully2 = /** @type {(inputs: Addressbook_Toasts_Connectedsuccessfully2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم الاتصال بنجاح!`)
};

/**
* | output |
* | --- |
* | "Connected Successfully!" |
*
* @param {Addressbook_Toasts_Connectedsuccessfully2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const addressbook_toasts_connectedsuccessfully2 = /** @type {((inputs?: Addressbook_Toasts_Connectedsuccessfully2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Addressbook_Toasts_Connectedsuccessfully2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_addressbook_toasts_connectedsuccessfully2(inputs)
	if (locale === "es") return es_addressbook_toasts_connectedsuccessfully2(inputs)
	if (locale === "fr") return fr_addressbook_toasts_connectedsuccessfully2(inputs)
	return ar_addressbook_toasts_connectedsuccessfully2(inputs)
});
export { addressbook_toasts_connectedsuccessfully2 as "addressBook.toasts.connectedSuccessfully" }