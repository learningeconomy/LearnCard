/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Contacts_SavingInputs */

const en_contacts_saving = /** @type {(inputs: Contacts_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Saving...`)
};

const es_contacts_saving = /** @type {(inputs: Contacts_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Guardando...`)
};

const fr_contacts_saving = /** @type {(inputs: Contacts_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrement...`)
};

const ar_contacts_saving = /** @type {(inputs: Contacts_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`...حفظ`)
};

/**
* | output |
* | --- |
* | "Saving..." |
*
* @param {Contacts_SavingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const contacts_saving = /** @type {((inputs?: Contacts_SavingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Contacts_SavingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_contacts_saving(inputs)
	if (locale === "es") return es_contacts_saving(inputs)
	if (locale === "fr") return fr_contacts_saving(inputs)
	return ar_contacts_saving(inputs)
});
export { contacts_saving as "contacts.saving" }