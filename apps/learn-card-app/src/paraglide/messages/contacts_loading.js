/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_LoadingInputs */

const en_contacts_loading = /** @type {(inputs: Contacts_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`loading...`)
};

const es_contacts_loading = /** @type {(inputs: Contacts_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando...`)
};

const fr_contacts_loading = /** @type {(inputs: Contacts_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement...`)
};

const ar_contacts_loading = /** @type {(inputs: Contacts_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري التحميل`)
};

/**
* | output |
* | --- |
* | "loading..." |
*
* @param {Contacts_LoadingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_loading = /** @type {((inputs?: Contacts_LoadingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_LoadingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_loading(inputs)
	if (locale === "es") return es_contacts_loading(inputs)
	if (locale === "fr") return fr_contacts_loading(inputs)
	return ar_contacts_loading(inputs)
});
export { contacts_loading as "contacts.loading" }