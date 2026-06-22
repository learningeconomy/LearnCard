/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ type: NonNullable<unknown> }} Endorsement_Media_ChangeInputs */

const en_endorsement_media_change = /** @type {(inputs: Endorsement_Media_ChangeInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Change ${i?.type}`)
};

const es_endorsement_media_change = /** @type {(inputs: Endorsement_Media_ChangeInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Cambiar ${i?.type}`)
};

const fr_endorsement_media_change = /** @type {(inputs: Endorsement_Media_ChangeInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Changer le ${i?.type}`)
};

const ar_endorsement_media_change = /** @type {(inputs: Endorsement_Media_ChangeInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`تغيير ${i?.type}`)
};

/**
* | output |
* | --- |
* | "Change {type}" |
*
* @param {Endorsement_Media_ChangeInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_media_change = /** @type {((inputs: Endorsement_Media_ChangeInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Media_ChangeInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_media_change(inputs)
	if (locale === "es") return es_endorsement_media_change(inputs)
	if (locale === "fr") return fr_endorsement_media_change(inputs)
	return ar_endorsement_media_change(inputs)
});
export { endorsement_media_change as "endorsement.media.change" }