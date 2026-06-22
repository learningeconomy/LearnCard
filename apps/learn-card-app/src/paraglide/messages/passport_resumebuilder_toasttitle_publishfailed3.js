/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Passport_Resumebuilder_Toasttitle_Publishfailed3Inputs */

const en_passport_resumebuilder_toasttitle_publishfailed3 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Publishfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publish Failed`)
};

const es_passport_resumebuilder_toasttitle_publishfailed3 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Publishfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Error al publicar`)
};

const fr_passport_resumebuilder_toasttitle_publishfailed3 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Publishfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Échec de la publication`)
};

const ar_passport_resumebuilder_toasttitle_publishfailed3 = /** @type {(inputs: Passport_Resumebuilder_Toasttitle_Publishfailed3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`فشل النشر`)
};

/**
* | output |
* | --- |
* | "Publish Failed" |
*
* @param {Passport_Resumebuilder_Toasttitle_Publishfailed3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const passport_resumebuilder_toasttitle_publishfailed3 = /** @type {((inputs?: Passport_Resumebuilder_Toasttitle_Publishfailed3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Passport_Resumebuilder_Toasttitle_Publishfailed3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_passport_resumebuilder_toasttitle_publishfailed3(inputs)
	if (locale === "es") return es_passport_resumebuilder_toasttitle_publishfailed3(inputs)
	if (locale === "fr") return fr_passport_resumebuilder_toasttitle_publishfailed3(inputs)
	return ar_passport_resumebuilder_toasttitle_publishfailed3(inputs)
});
export { passport_resumebuilder_toasttitle_publishfailed3 as "passport.resumeBuilder.toastTitle.publishFailed" }