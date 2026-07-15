/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_UpdatingInputs */

const en_common_updating = /** @type {(inputs: Common_UpdatingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Updating...`)
};

const es_common_updating = /** @type {(inputs: Common_UpdatingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizando...`)
};

const fr_common_updating = /** @type {(inputs: Common_UpdatingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mise à jour...`)
};

const ar_common_updating = /** @type {(inputs: Common_UpdatingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جارٍ التحديث...`)
};

/**
* | output |
* | --- |
* | "Updating..." |
*
* @param {Common_UpdatingInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_updating = /** @type {((inputs?: Common_UpdatingInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_UpdatingInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_updating(inputs)
	if (locale === "es") return es_common_updating(inputs)
	if (locale === "fr") return fr_common_updating(inputs)
	return ar_common_updating(inputs)
});
export { common_updating as "common.updating" }