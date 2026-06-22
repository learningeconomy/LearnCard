/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Delete_ConfirmInputs */

const en_endorsement_delete_confirm = /** @type {(inputs: Endorsement_Delete_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Yes, Delete`)
};

const es_endorsement_delete_confirm = /** @type {(inputs: Endorsement_Delete_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Sí, eliminar`)
};

const fr_endorsement_delete_confirm = /** @type {(inputs: Endorsement_Delete_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Oui, supprimer`)
};

const ar_endorsement_delete_confirm = /** @type {(inputs: Endorsement_Delete_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نعم، حذف`)
};

/**
* | output |
* | --- |
* | "Yes, Delete" |
*
* @param {Endorsement_Delete_ConfirmInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_delete_confirm = /** @type {((inputs?: Endorsement_Delete_ConfirmInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Delete_ConfirmInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_delete_confirm(inputs)
	if (locale === "es") return es_endorsement_delete_confirm(inputs)
	if (locale === "fr") return fr_endorsement_delete_confirm(inputs)
	return ar_endorsement_delete_confirm(inputs)
});
export { endorsement_delete_confirm as "endorsement.delete.confirm" }