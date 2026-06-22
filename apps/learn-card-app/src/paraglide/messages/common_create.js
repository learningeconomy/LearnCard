/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_CreateInputs */

const en_common_create = /** @type {(inputs: Common_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Create`)
};

const es_common_create = /** @type {(inputs: Common_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Crear`)
};

const fr_common_create = /** @type {(inputs: Common_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Créer`)
};

const ar_common_create = /** @type {(inputs: Common_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`إنشاء`)
};

/**
* | output |
* | --- |
* | "Create" |
*
* @param {Common_CreateInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_create = /** @type {((inputs?: Common_CreateInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_CreateInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_create(inputs)
	if (locale === "es") return es_common_create(inputs)
	if (locale === "fr") return fr_common_create(inputs)
	return ar_common_create(inputs)
});
export { common_create as "common.create" }