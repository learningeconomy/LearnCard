/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Common_PublishInputs */

const en_common_publish = /** @type {(inputs: Common_PublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publish`)
};

const es_common_publish = /** @type {(inputs: Common_PublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publicar`)
};

const fr_common_publish = /** @type {(inputs: Common_PublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publier`)
};

const ar_common_publish = /** @type {(inputs: Common_PublishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نشر`)
};

/**
* | output |
* | --- |
* | "Publish" |
*
* @param {Common_PublishInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const common_publish = /** @type {((inputs?: Common_PublishInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_PublishInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_common_publish(inputs)
	if (locale === "es") return es_common_publish(inputs)
	if (locale === "fr") return fr_common_publish(inputs)
	return ar_common_publish(inputs)
});
export { common_publish as "common.publish" }