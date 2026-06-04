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

const de_contacts_loading = /** @type {(inputs: Contacts_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Laden...`)
};

const ar_contacts_loading = /** @type {(inputs: Contacts_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...جاري التحميل`)
};

const fr_contacts_loading = /** @type {(inputs: Contacts_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement...`)
};

const ko_contacts_loading = /** @type {(inputs: Contacts_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`로딩...`)
};

/**
* | output |
* | --- |
* | "loading..." |
*
* @param {Contacts_LoadingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const contacts_loading = /** @type {((inputs?: Contacts_LoadingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_LoadingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_loading(inputs)
	if (locale === "es") return es_contacts_loading(inputs)
	if (locale === "de") return de_contacts_loading(inputs)
	if (locale === "ar") return ar_contacts_loading(inputs)
	if (locale === "fr") return fr_contacts_loading(inputs)
	return ko_contacts_loading(inputs)
});
export { contacts_loading as "contacts.loading" }