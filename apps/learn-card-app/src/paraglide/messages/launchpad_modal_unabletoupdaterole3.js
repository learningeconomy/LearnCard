/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launchpad_Modal_Unabletoupdaterole3Inputs */

const en_launchpad_modal_unabletoupdaterole3 = /** @type {(inputs: Launchpad_Modal_Unabletoupdaterole3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to update role`)
};

const es_launchpad_modal_unabletoupdaterole3 = /** @type {(inputs: Launchpad_Modal_Unabletoupdaterole3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo actualizar el rol`)
};

const fr_launchpad_modal_unabletoupdaterole3 = /** @type {(inputs: Launchpad_Modal_Unabletoupdaterole3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de mettre à jour le rôle`)
};

const ar_launchpad_modal_unabletoupdaterole3 = /** @type {(inputs: Launchpad_Modal_Unabletoupdaterole3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تعذر تحديث الدور`)
};

/**
* | output |
* | --- |
* | "Unable to update role" |
*
* @param {Launchpad_Modal_Unabletoupdaterole3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const launchpad_modal_unabletoupdaterole3 = /** @type {((inputs?: Launchpad_Modal_Unabletoupdaterole3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launchpad_Modal_Unabletoupdaterole3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launchpad_modal_unabletoupdaterole3(inputs)
	if (locale === "es") return es_launchpad_modal_unabletoupdaterole3(inputs)
	if (locale === "fr") return fr_launchpad_modal_unabletoupdaterole3(inputs)
	return ar_launchpad_modal_unabletoupdaterole3(inputs)
});
export { launchpad_modal_unabletoupdaterole3 as "launchpad.modal.unableToUpdateRole" }