/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_StatusInputs */

const en_common_status = /** @type {(inputs: Common_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Status`)
};

const es_common_status = /** @type {(inputs: Common_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Estado`)
};

const fr_common_status = /** @type {(inputs: Common_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Statut`)
};

const ar_common_status = /** @type {(inputs: Common_StatusInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الحالة`)
};

/**
* | output |
* | --- |
* | "Status" |
*
* @param {Common_StatusInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_status = /** @type {((inputs?: Common_StatusInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_StatusInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_status(inputs)
	if (locale === "es") return es_common_status(inputs)
	if (locale === "fr") return fr_common_status(inputs)
	return ar_common_status(inputs)
});
export { common_status as "common.status" }