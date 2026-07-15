/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Boostcms_Publishsend4Inputs */

const en_boostcms_publishsend4 = /** @type {(inputs: Boostcms_Publishsend4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publish & Send`)
};

const es_boostcms_publishsend4 = /** @type {(inputs: Boostcms_Publishsend4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publicar y Enviar`)
};

const fr_boostcms_publishsend4 = /** @type {(inputs: Boostcms_Publishsend4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publier et envoyer`)
};

const ar_boostcms_publishsend4 = /** @type {(inputs: Boostcms_Publishsend4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`نشر وإرسال`)
};

/**
* | output |
* | --- |
* | "Publish & Send" |
*
* @param {Boostcms_Publishsend4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const boostcms_publishsend4 = /** @type {((inputs?: Boostcms_Publishsend4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Boostcms_Publishsend4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_boostcms_publishsend4(inputs)
	if (locale === "es") return es_boostcms_publishsend4(inputs)
	if (locale === "fr") return fr_boostcms_publishsend4(inputs)
	return ar_boostcms_publishsend4(inputs)
});
export { boostcms_publishsend4 as "boostCMS.publishSend" }